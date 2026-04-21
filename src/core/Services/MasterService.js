import mongoose from 'mongoose';
import { CATEGORY_MAP } from '@/constants/categories.js';
import { STATUS, VERIFICATION_STATUS, VENDOR_PROFILE_TYPES } from '@/constants/index.js';

/**
 * MasterService (Universal Role)
 * Centralized logic for handling status transitions across different entities.
 */
class MasterService {
    /**
     * Checks if a vendor meets all criteria to show packages to travellers.
     * 1. Profile Status -> 'active'
     * 2. Manual Switch -> isOperating: true
     * 3. Admin Approval -> isApproved: true
     * 4. Documents -> All REQUIRED documents must be 'verified'
     * 5. Operational -> Not currently on vacation (Closure check)
     */
    async isVendorActive(vendor) {
        if (!vendor) return false;

        // 1. Basic Status Checks
        const isBasicActive = (
            vendor.status === STATUS.ACTIVE &&
            vendor.isOperating === true &&
            vendor.isApproved === true
        );
        if (!isBasicActive) return false;

        // 2. Document Verification Checks (Conditional based on Profile Type)
        const docs = vendor.documents || {};
        const isIndividualVerified = (
            docs.panCard?.status === VERIFICATION_STATUS.VERIFIED &&
            (docs.aadharCard && Array.isArray(docs.aadharCard) && docs.aadharCard.every(d => d.status === VERIFICATION_STATUS.VERIFIED))
        );

        if (!isIndividualVerified) return false;

        // If Business, check additional registrations
        if (vendor.profileType === VENDOR_PROFILE_TYPES.BUSINESS) {
            const isBusinessVerified = (
                docs.businessRegistration?.status === VERIFICATION_STATUS.VERIFIED &&
                (!docs.gstRegistration?.url || docs.gstRegistration?.status === VERIFICATION_STATUS.VERIFIED)
            );
            if (!isBusinessVerified) return false;
        }

        // 3. Operational/Closure Check
        return await this.isVendorOperational(vendor._id);
    }

    /**
     * Returns the aggregation match stage for active vendors with conditional document verification.
     */
    getVendorActiveAggregationStages(vendorProfileField = 'vendorProfile') {
        const now = new Date();
        return [
            {
                $match: {
                    [`${vendorProfileField}.status`]: 'active',
                    [`${vendorProfileField}.isOperating`]: true,
                    [`${vendorProfileField}.isApproved`]: true
                }
            },
            {
                $match: {
                    $or: [
                        {
                            [`${vendorProfileField}.profileType`]: VENDOR_PROFILE_TYPES.INDIVIDUAL,
                            [`${vendorProfileField}.documents.panCard.status`]: VERIFICATION_STATUS.VERIFIED
                        },
                        {
                            [`${vendorProfileField}.profileType`]: VENDOR_PROFILE_TYPES.BUSINESS,
                            [`${vendorProfileField}.documents.panCard.status`]: VERIFICATION_STATUS.VERIFIED,
                            [`${vendorProfileField}.documents.businessRegistration.status`]: VERIFICATION_STATUS.VERIFIED
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'vendorclosures',
                    let: { vendorId: `$${vendorProfileField}._id` },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$vendor', '$$vendorId'] },
                                        { $eq: ['$isActive', true] },
                                        { $lte: ['$startDate', now] },
                                        { $gte: ['$endDate', now] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'currentClosures'
                }
            },
            {
                $match: { currentClosures: { $size: 0 } }
            }
        ];
    }

    /**
     * Returns aggregation stages to filter items based on their category verification status.
     * This ensures only packages from verified categories are shown.
     */
    getCategoryVerificationStages(itemField = 'items', vendorIdField = 'vendorProfile._id') {
        const categoryMapping = CATEGORY_MAP;
        return [
            {
                $lookup: {
                    from: 'vendordocuments',
                    let: { 
                        vendorId: `$${vendorIdField}`, 
                        categoryKey: `$${itemField}.category` 
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: [ { $toString: '$vendor' }, { $toString: '$$vendorId' } ] },
                                        { $eq: ['$status', 'verified'] },
                                        {
                                            $eq: [
                                                '$category_slug',
                                                {
                                                    $switch: {
                                                        branches: Object.keys(categoryMapping).map(slug => ({
                                                            case: { $eq: ['$$categoryKey', categoryMapping[slug]] },
                                                            then: slug
                                                        })),
                                                        default: '$$categoryKey'
                                                    }
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
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

    /**
     * Checks if a vendor is currently operating (not closed)
     */
    async isVendorOperational(vendorId) {
        const now = new Date();
        const closure = await mongoose.model('VendorClosure').findOne({
            vendor: vendorId,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });
        return !closure;
    }
}

export default new MasterService();
