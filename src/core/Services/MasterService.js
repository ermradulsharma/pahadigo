/**
 * @file MasterService.js
 * @module core/Services/MasterService
 * @description Centralized, universal business logic and compliance engine for PahadiGo.
 *
 * Single Source of Truth for:
 * 1. Vendor Operating Status     : status: 'active', isOperating: true, isApproved: true, deletedAt: null
 * 2. Mandatory KYC Verification  : Individual (PAN + Aadhaar Front & Back size 2); Business (+ Business Registration)
 * 3. Conditional GST Verification : If a GST document is uploaded, it MUST be status: 'verified'
 * 4. Vendor Vacation & Closures  : Automatic exclusion of vendors on active leave (startDate <= now <= endDate)
 * 5. Category Compliance         : Verified category document required; STRICTLY BLOCKS any category with EXPIRED documents (expiry_date < now)
 * 6. High-Performance Execution  : 60-second in-memory micro-cache + MongoDB index-friendly early $limit: 1 pipeline stages
 * 7. Standardized queryHelpers   : Model-level queries execute through queryHelpers (getById, getBy) with lean projections
 */

import mongoose from 'mongoose';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';
import { STATUS, VERIFICATION_STATUS, VENDOR_PROFILE_TYPES, DEFAULTS } from '@/core/Constants/index.js';
import Vendor from '@/core/Models/Vendor.js';
import VendorClosure from '@/core/Models/VendorClosure.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import { getById, getBy } from '@/core/Helpers/queryHelpers.js';

// =============================================================================
// MICRO-CACHING ARCHITECTURE
// =============================================================================

/**
 * 60-second in-memory micro-cache to eliminate redundant MongoDB lookups for hot vendors.
 * Avoids executing duplicate queries across nested package items or repeat searches within the same minute.
 * @type {Map<string, { isOperational: boolean, expiresAt: number }>}
 */
const operationalCache = new Map();

/**
 * 60-second in-memory micro-cache for category verification and expiry evaluation.
 * @type {Map<string, { isVerified: boolean, expiresAt: number }>}
 */
const categoryVerificationCache = new Map();

/**
 * Time-To-Live for micro-caches in milliseconds (60 seconds).
 * @constant {number}
 */
const MICRO_CACHE_TTL_MS = 60 * 1000;

/**
 * Evicts expired entries from a cache map once its size exceeds 500 entries to prevent memory leaks.
 * @param {Map} cacheMap - Target cache map
 */
function cleanExpiredCache(cacheMap) {
    if (cacheMap.size > 500) {
        const now = Date.now();
        for (const [key, val] of cacheMap.entries()) {
            if (now > val.expiresAt) cacheMap.delete(key);
        }
    }
}

// =============================================================================
// MASTER SERVICE CLASS IMPLEMENTATION
// =============================================================================

/**
 * MasterService (Universal Role)
 * Coordinates and enforces all compliance, status transitions, and verification rules across the system.
 */
class MasterService {

    // =========================================================================
    // 1. Single Entity JavaScript Verification
    // =========================================================================

    /**
     * Strict check to determine if a single vendor meets all operational and KYC criteria to sell packages.
     *
     * Validates:
     * 1. Soft Delete       -> deletedAt must be null/undefined
     * 2. Basic Status      -> status: 'active', isOperating: true, isApproved: true
     * 3. PAN Card          -> status: 'verified' and URL must be a non-empty string
     * 4. Aadhaar Card      -> Exactly 2 documents (Front & Back), both status: 'verified' and URLs must exist
     * 5. Business Profile  -> businessRegistration status: 'verified' and URL must exist (if profileType === 'business')
     * 6. GST Registration -> If GST document URL is provided, its status must be 'verified'
     * 7. Operational Status -> Not currently on vacation/closure (startDate <= now <= endDate)
     *
     * @async
     * @param {Object|string|mongoose.Types.ObjectId} vendor - Vendor document object or Vendor ObjectId
     * @returns {Promise<boolean>} True if vendor is 100% compliant and operating, False otherwise
     */
    async isVendorActive(vendor) {
        if (!vendor) return DEFAULTS.FALSE;

        let vendorDoc = vendor;
        if (typeof vendor === 'string' || vendor instanceof mongoose.Types.ObjectId) {
            // Standardized queryHelper fetch with lean projection of verification fields
            vendorDoc = await getById(Vendor, vendor, '_id status isOperating isApproved deletedAt documents profileType');
        }
        if (!vendorDoc || typeof vendorDoc !== 'object') return DEFAULTS.FALSE;

        // Step 1: Soft Delete Check
        if (vendorDoc.deletedAt) return DEFAULTS.FALSE;

        // Step 2: Basic Operating Status Checks
        const isBasicActive = (
            vendorDoc.status === STATUS.ACTIVE &&
            (vendorDoc.isOperating === DEFAULTS.TRUE || vendorDoc.isOperating === true) &&
            (vendorDoc.isApproved === DEFAULTS.TRUE || vendorDoc.isApproved === true)
        );
        if (!isBasicActive) return DEFAULTS.FALSE;

        // Step 3: Document Verification Checks
        const docs = vendorDoc.documents || {};

        // Step 3.1: PAN Card Check (Verified status AND non-empty URL)
        const isPanVerified = (
            docs.panCard?.status === VERIFICATION_STATUS.VERIFIED &&
            Boolean(docs.panCard?.url)
        );
        if (!isPanVerified) return DEFAULTS.FALSE;

        // Step 3.2: Aadhaar Card Check (Strictly 2 documents: Front & Back, both verified AND non-empty URLs)
        const isAadharVerified = (
            Array.isArray(docs.aadharCard) &&
            docs.aadharCard.length === 2 &&
            docs.aadharCard[0]?.status === VERIFICATION_STATUS.VERIFIED &&
            Boolean(docs.aadharCard[0]?.url) &&
            docs.aadharCard[1]?.status === VERIFICATION_STATUS.VERIFIED &&
            Boolean(docs.aadharCard[1]?.url)
        );
        if (!isAadharVerified) return DEFAULTS.FALSE;

        // Step 3.3: Business Profile Checks
        if (vendorDoc.profileType === VENDOR_PROFILE_TYPES.BUSINESS) {
            const isBusinessVerified = (
                docs.businessRegistration?.status === VERIFICATION_STATUS.VERIFIED &&
                Boolean(docs.businessRegistration?.url) &&
                (!docs.gstRegistration?.url || docs.gstRegistration?.status === VERIFICATION_STATUS.VERIFIED)
            );
            if (!isBusinessVerified) return DEFAULTS.FALSE;
        }

        // Step 4: Operational/Closure Check (Leverages micro-cache for sub-millisecond response)
        return await this.isVendorOperational(vendorDoc._id);
    }

    // =========================================================================
    // 2. High-Performance MongoDB Aggregation Stages (Vendor Compliance)
    // =========================================================================

    /**
     * Generates indexed, high-performance aggregation match stages for active vendors.
     * Enforces active status, non-deleted state, PAN, Aadhaar (2 verified docs),
     * Business Registration, GST verification (if uploaded), and active vacation closures exclusion.
     *
     * Performance Optimizations:
     * - Uses early `$limit: 1` inside `$lookup` to exit sub-pipeline on first match.
     * - Uses thin projection (`{ $project: { _id: 1 } }`) to prevent loading unnecessary fields.
     * - Places indexable predicates (`isActive: true`, `startDate <= now`, `endDate >= now`) at the root level.
     *
     * @param {string} [vendorProfileField='vendorProfile'] - Joined vendor profile field path
     * @returns {Array<Object>} MongoDB aggregation pipeline stages
     */
    getVendorActiveAggregationStages(vendorProfileField = 'vendorProfile') {
        const now = new Date();
        return [
            // Stage 1: Basic Operating Status & Soft Delete Check
            {
                $match: {
                    [`${vendorProfileField}.status`]: STATUS.ACTIVE,
                    [`${vendorProfileField}.isOperating`]: DEFAULTS.TRUE,
                    [`${vendorProfileField}.isApproved`]: DEFAULTS.TRUE,
                    $or: [
                        { [`${vendorProfileField}.deletedAt`]: null },
                        { [`${vendorProfileField}.deletedAt`]: { $exists: false } }
                    ]
                }
            },
            // Stage 2: KYC Verification for Individual vs Business
            {
                $match: {
                    $or: [
                        {
                            [`${vendorProfileField}.profileType`]: VENDOR_PROFILE_TYPES.INDIVIDUAL,
                            [`${vendorProfileField}.documents.panCard.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${vendorProfileField}.documents.panCard.url`]: { $type: 'string', $ne: '' },
                            [`${vendorProfileField}.documents.aadharCard`]: { $size: 2 },
                            [`${vendorProfileField}.documents.aadharCard.0.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${vendorProfileField}.documents.aadharCard.0.url`]: { $type: 'string', $ne: '' },
                            [`${vendorProfileField}.documents.aadharCard.1.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${vendorProfileField}.documents.aadharCard.1.url`]: { $type: 'string', $ne: '' }
                        },
                        {
                            [`${vendorProfileField}.profileType`]: VENDOR_PROFILE_TYPES.BUSINESS,
                            [`${vendorProfileField}.documents.panCard.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${vendorProfileField}.documents.panCard.url`]: { $type: 'string', $ne: '' },
                            [`${vendorProfileField}.documents.aadharCard`]: { $size: 2 },
                            [`${vendorProfileField}.documents.aadharCard.0.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${vendorProfileField}.documents.aadharCard.0.url`]: { $type: 'string', $ne: '' },
                            [`${vendorProfileField}.documents.aadharCard.1.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${vendorProfileField}.documents.aadharCard.1.url`]: { $type: 'string', $ne: '' },
                            [`${vendorProfileField}.documents.businessRegistration.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${vendorProfileField}.documents.businessRegistration.url`]: { $type: 'string', $ne: '' },
                            $or: [
                                { [`${vendorProfileField}.documents.gstRegistration.url`]: null },
                                { [`${vendorProfileField}.documents.gstRegistration.url`]: { $exists: false } },
                                { [`${vendorProfileField}.documents.gstRegistration.status`]: VERIFICATION_STATUS.VERIFIED }
                            ]
                        }
                    ]
                }
            },
            // Stage 3: Operational Vacation/Closure Lookup with Early Exit ($limit: 1)
            {
                $lookup: {
                    from: 'vendorclosures',
                    let: { vId: `$${vendorProfileField}._id` },
                    pipeline: [
                        {
                            $match: {
                                isActive: DEFAULTS.TRUE,
                                startDate: { $lte: now },
                                endDate: { $gte: now },
                                $expr: {
                                    $or: [
                                        { $eq: ['$vendor', '$$vId'] },
                                        { $eq: ['$vendor', { $toObjectId: '$$vId' }] }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 },
                        { $project: { _id: 1 } }
                    ],
                    as: 'currentClosures'
                }
            },
            // Stage 4: Ensure Vendor Has Zero Active Closures
            {
                $match: { currentClosures: { $size: 0 } }
            }
        ];
    }

    // =========================================================================
    // 3. Category Compliance & Document Expiry Aggregation Stages
    // =========================================================================

    /**
     * Generates aggregation stages to filter package items based on category compliance.
     *
     * Strictly verifies that:
     * 1. No document for this category has expired (expiry_date < now).
     * 2. At least one verified, non-expired document with valid URL exists.
     *
     * @param {string} [itemField='items'] - Field path of unwound package item in pipeline
     * @param {string} [vendorIdField='vendorProfile._id'] - Field path of Vendor ObjectId
     * @returns {Array<Object>} MongoDB aggregation pipeline stages
     */
    getCategoryVerificationStages(itemField = 'items', vendorIdField = 'vendorProfile._id') {
        const now = new Date();
        const categoryMapping = CATEGORY_MAP;
        return [
            // Stage 1: Reject item if ANY document for this vendor & category has EXPIRED
            {
                $lookup: {
                    from: 'vendordocuments',
                    let: {
                        vId: `$${vendorIdField}`,
                        catKey: `$${itemField}.category`
                    },
                    pipeline: [
                        {
                            $match: {
                                expiry_date: { $ne: null, $lt: now },
                                $expr: {
                                    $and: [
                                        {
                                            $or: [
                                                { $eq: ['$vendor', '$$vId'] },
                                                { $eq: ['$vendor', { $toObjectId: '$$vId' }] }
                                            ]
                                        },
                                        {
                                            $eq: [
                                                '$category_slug',
                                                {
                                                    $switch: {
                                                        branches: Object.keys(categoryMapping).map(slug => ({
                                                            case: { $eq: ['$$catKey', categoryMapping[slug]] },
                                                            then: slug
                                                        })),
                                                        default: '$$catKey'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 },
                        { $project: { _id: 1 } }
                    ],
                    as: 'expiredCategoryDocs'
                }
            },
            {
                $match: {
                    expiredCategoryDocs: { $size: 0 }
                }
            },
            // Stage 2: Ensure at least one verified and valid document exists
            {
                $lookup: {
                    from: 'vendordocuments',
                    let: {
                        vId: `$${vendorIdField}`,
                        catKey: `$${itemField}.category`
                    },
                    pipeline: [
                        {
                            $match: {
                                status: VERIFICATION_STATUS.VERIFIED,
                                url: { $ne: null },
                                $or: [
                                    { expiry_date: null },
                                    { expiry_date: { $gte: now } }
                                ],
                                $expr: {
                                    $and: [
                                        {
                                            $or: [
                                                { $eq: ['$vendor', '$$vId'] },
                                                { $eq: ['$vendor', { $toObjectId: '$$vId' }] }
                                            ]
                                        },
                                        {
                                            $eq: [
                                                '$category_slug',
                                                {
                                                    $switch: {
                                                        branches: Object.keys(categoryMapping).map(slug => ({
                                                            case: { $eq: ['$$catKey', categoryMapping[slug]] },
                                                            then: slug
                                                        })),
                                                        default: '$$catKey'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        },
                        { $limit: 1 },
                        { $project: { _id: 1 } }
                    ],
                    as: 'categoryDocs'
                }
            },
            {
                $match: {
                    categoryDocs: { $not: { $size: 0 } }
                }
            }
        ];
    }

    // =========================================================================
    // 4. Operational Vacation / Closure Verification
    // =========================================================================

    /**
     * Checks if a vendor is currently operational (not on active vacation or closure).
     * Backed by a 60-second micro-cache and thin `_id` projection via queryHelpers.
     *
     * @async
     * @param {string|mongoose.Types.ObjectId} vendorId - Vendor ObjectId
     * @returns {Promise<boolean>} True if vendor is operational, False if on active closure
     */
    async isVendorOperational(vendorId) {
        if (!vendorId) return DEFAULTS.FALSE;
        const idStr = vendorId.toString();

        // Step 1: Check micro-cache (0ms response)
        const cached = operationalCache.get(idStr);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.isOperational;
        }

        const now = new Date();
        const parsedId = mongoose.Types.ObjectId.isValid(vendorId)
            ? (vendorId instanceof mongoose.Types.ObjectId ? vendorId : new mongoose.Types.ObjectId(vendorId))
            : vendorId;

        // Step 2: Standardized queryHelper fetch with thin indexed lookup
        const closure = await getBy(VendorClosure, {
            vendor: parsedId,
            isActive: DEFAULTS.TRUE,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }, '_id');

        const isOperational = !closure;

        // Step 3: Store in micro-cache
        cleanExpiredCache(operationalCache);
        operationalCache.set(idStr, {
            isOperational,
            expiresAt: Date.now() + MICRO_CACHE_TTL_MS
        });

        return isOperational;
    }

    // =========================================================================
    // 5. Category Document Verification & Expiry Evaluation
    // =========================================================================

    /**
     * Validates if a vendor has an active, verified, and non-expired document for a category.
     * If ANY document for that category has expired, the category is considered unverified/blocked.
     * Backed by a 60-second micro-cache and thin `_id` projection via queryHelpers.
     *
     * @async
     * @param {string|mongoose.Types.ObjectId} vendorId - Vendor ObjectId
     * @param {string} categorySlug - Category slug (e.g. 'homestay', 'trekking')
     * @returns {Promise<boolean>} True if verified and non-expired, False otherwise
     */
    async isCategoryVerified(vendorId, categorySlug) {
        if (!vendorId || !categorySlug) return DEFAULTS.FALSE;
        const vIdStr = vendorId.toString();
        const slug = (typeof categorySlug === 'string') ? categorySlug.trim().toLowerCase() : '';
        const mappedSlug = Object.keys(CATEGORY_MAP).find(k => (CATEGORY_MAP[k] || '').toLowerCase() === slug) || slug;
        const cacheKey = `${vIdStr}::${slug}`;

        // Step 1: Check micro-cache
        const cached = categoryVerificationCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.isVerified;
        }

        const now = new Date();
        const parsedId = mongoose.Types.ObjectId.isValid(vendorId)
            ? (vendorId instanceof mongoose.Types.ObjectId ? vendorId : new mongoose.Types.ObjectId(vendorId))
            : vendorId;

        // Step 2: Strict Expiry Check: If ANY document of this category has passed expiry date, REJECT immediately!
        const expiredDoc = await getBy(VendorDocument, {
            vendor: parsedId,
            category_slug: { $in: [slug, mappedSlug] },
            expiry_date: { $ne: null, $lt: now }
        }, '_id');

        if (expiredDoc) {
            cleanExpiredCache(categoryVerificationCache);
            categoryVerificationCache.set(cacheKey, {
                isVerified: false,
                expiresAt: Date.now() + MICRO_CACHE_TTL_MS
            });
            return false;
        }

        // Step 3: Must have at least one verified document with valid URL and non-expired date
        const doc = await getBy(VendorDocument, {
            vendor: parsedId,
            category_slug: { $in: [slug, mappedSlug] },
            status: VERIFICATION_STATUS.VERIFIED,
            url: { $ne: null },
            $or: [
                { expiry_date: null },
                { expiry_date: { $exists: false } },
                { expiry_date: { $gte: now } }
            ]
        }, '_id');

        const isVerified = Boolean(doc);

        cleanExpiredCache(categoryVerificationCache);
        categoryVerificationCache.set(cacheKey, {
            isVerified,
            expiresAt: Date.now() + MICRO_CACHE_TTL_MS
        });

        return isVerified;
    }

    // =========================================================================
    // 6. Centralized Reusable Mongoose Match Criteria
    // =========================================================================

    /**
     * Reusable, index-friendly strict vendor active match criteria for Mongoose find() queries.
     * Can be used directly or with a field prefix (e.g. 'vendorProfile.') for nested lookups.
     *
     * @param {string} [prefix=''] - Optional field prefix
     * @returns {Object} Mongoose match query object
     */
    getVendorActiveMatchCriteria(prefix = '') {
        const p = prefix ? `${prefix}.` : '';
        return {
            [`${p}status`]: STATUS.ACTIVE,
            [`${p}isOperating`]: DEFAULTS.TRUE,
            [`${p}isApproved`]: DEFAULTS.TRUE,
            $or: [
                { [`${p}deletedAt`]: null },
                { [`${p}deletedAt`]: { $exists: false } }
            ],
            $and: [
                {
                    $or: [
                        {
                            [`${p}profileType`]: VENDOR_PROFILE_TYPES.INDIVIDUAL,
                            [`${p}documents.panCard.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${p}documents.panCard.url`]: { $type: 'string', $ne: '' },
                            [`${p}documents.aadharCard`]: { $size: 2 },
                            [`${p}documents.aadharCard.0.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${p}documents.aadharCard.0.url`]: { $type: 'string', $ne: '' },
                            [`${p}documents.aadharCard.1.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${p}documents.aadharCard.1.url`]: { $type: 'string', $ne: '' }
                        },
                        {
                            [`${p}profileType`]: VENDOR_PROFILE_TYPES.BUSINESS,
                            [`${p}documents.panCard.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${p}documents.panCard.url`]: { $type: 'string', $ne: '' },
                            [`${p}documents.aadharCard`]: { $size: 2 },
                            [`${p}documents.aadharCard.0.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${p}documents.aadharCard.0.url`]: { $type: 'string', $ne: '' },
                            [`${p}documents.aadharCard.1.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${p}documents.aadharCard.1.url`]: { $type: 'string', $ne: '' },
                            [`${p}documents.businessRegistration.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${p}documents.businessRegistration.url`]: { $type: 'string', $ne: '' },
                            $or: [
                                { [`${p}documents.gstRegistration.url`]: null },
                                { [`${p}documents.gstRegistration.url`]: { $exists: false } },
                                { [`${p}documents.gstRegistration.status`]: VERIFICATION_STATUS.VERIFIED }
                            ]
                        }
                    ]
                }
            ]
        };
    }
}

export default new MasterService();
