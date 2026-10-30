import mongoose from 'mongoose';
import User from '@/core/Models/User.js';
import Booking from '@/core/Models/Booking.js';
import Review from '@/core/Models/Review.js';
import Dispute from '@/core/Models/Dispute.js';
import { BaseAuthService, UserAuthService } from '@/core/Services/Auth/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, STATUS, BOOKING_STATUS, PAYMENT_STATUS, PAYOUT_STATUS } from '@/core/Constants/index.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { businessPayload, getBusinessById, getBusinessByUserId, getPackageBy, getUserById, getVendorDocumentsBy, updateById, itemsFormate, transformAuthResponse, userAuthResponse } from '@/core/Helpers/index.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import Controller from '@/core/Controllers/Controller.js';
import UserEvents from '@/core/Events/UserEvents.js';

import CacheService from '@/core/Services/CacheService.js';
import SOSService from '@/core/Services/General/SOSService.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { getLogger } from '@/core/Lib/logger.js';
import { NOTIFICATION } from '@/core/Constants/notification';

/**
 * @file ProfileController.js
 * @module Http/Controllers/Auth/User/ProfileController
 * @description Centralized controller managing user profiles, account state, role transitions,
 * emergency safety (SOS), and vendor verification/operational dashboard analytics.
 * Supports dual contexts for Travellers and Vendors with optimized MongoDB aggregation pipelines,
 * selective subdocument projections, and Redis caching integration.
 */

/**
 * @class ProfileController
 * @extends Controller
 * @classdesc Orchestrates user profile lifecycle operations for both Travellers and Vendors.
 * Handles identity verification, security statuses, profile photo uploads to Cloudinary,
 * GeoJSON coordinate parsing, role elevation/downgrade, and financial withholding metrics.
 */
class ProfileController extends Controller {

    /**
     * Fetch the authenticated user's profile.
     * 
     * @route GET /api/traveller/me
     * @route GET /api/vendor/me
     * @access Private (Authenticated User)
     * @param {import('next/server').NextRequest & { user: { id: string, role: string } }} req - Incoming Next.js request with decoded auth payload.
     * @returns {Promise<import('next/server').NextResponse>} JSON response containing sanitized user profile data.
     * @throws {500} Internal server error if database lookup fails.
     */
    async getProfile(req) {
        try {
            const userId = req.user.id;
            const user = await getUserById(userId);
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.USER.NOT_FOUND);
            const result = await userAuthResponse(user);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * Toggle the account active/inactive status of the authenticated user.
     * Blocks activation if the user account is suspended or blocked by administration.
     * Automatically adjusts status to PENDING if activating an unverified account.
     * 
     * @route PATCH /api/traveller/status
     * @route PATCH /api/vendor/status
     * @access Private (Authenticated User)
     * @param {import('next/server').NextRequest & { user: { id: string }, payload: { status: boolean } }} req - Request containing target status boolean.
     * @returns {Promise<import('next/server').NextResponse>} Success message confirming activation or deactivation.
     * @throws {400} If status is not a boolean.
     * @throws {403} If account is currently suspended or blocked.
     * @throws {404} If user record is not found.
     * @throws {500} On database or execution failure.
     */
    async toggleAccountStatus(req) {
        try {
            const { status } = req.payload;
            if (typeof status !== 'boolean') return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.INVALID_REQUEST);

            const user = await getUserById(req.user.id, 'status isVerified');
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND);
            if (status === true && (user.status === STATUS.BLOCKED || user.status === STATUS.SUSPENDED)) {
                return this.error(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.VENDOR.ACCOUNT_RESTRICTED);
            }

            const newStatus = status === true
                ? (user.isVerified === true ? STATUS.ACTIVE : STATUS.PENDING)
                : STATUS.INACTIVE;

            await updateById(User, req.user.id, { status: newStatus });

            try {
                await CacheService.del(`user:profile:${req.user.id}`);
                await CacheService.del(`user:profile:full:${req.user.id}`);
            } catch (cacheError) { }

            const message = status ? RESPONSE_MESSAGES.AUTH.ACTIVATED : RESPONSE_MESSAGES.AUTH.DEACTIVATED;
            return this.success(HTTP_STATUS.OK, message, { status: newStatus });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    /**
     * Update the authenticated user's profile details.
     * Sanitizes inputs via an explicit field whitelist, parses Cloudinary file uploads or direct URLs,
     * normalizes Date of Birth to prevent CastErrors, formats emergency contacts,
     * generates GeoJSON Point coordinates for addresses, updates Redis cache, and emits profile update events.
     * 
     * @route PATCH /api/traveller/update
     * @route PATCH /api/vendor/update
     * @access Private (Authenticated User)
     * @param {import('next/server').NextRequest & { user: { id: string }, payload: Object }} req - Request containing partial profile fields.
     * @returns {Promise<import('next/server').NextResponse>} Standardized updated profile payload.
     * @throws {500} If profile update or image upload fails.
     */
    async updateProfile(req) {
        try {
            const body = req.payload;
            const allowedFields = [
                'name', 'phone', 'gender', 'dateOfBirth', 'bloodGroup',
                'designation', 'bio', 'website', 'socialLinks', 'emergencyContacts',
                'address', 'preferences', 'profileImage', 'expertise',
                'medicalConditions', 'experience'
            ];
            const updates = {};
            Object.keys(body).forEach(key => {
                if (allowedFields.includes(key) && body[key] !== undefined) updates[key] = body[key];
            });

            // 1. Safe profile image handling (Upload to Cloudinary ONLY if it is an actual file object; if string URL, keep as is)
            const profileImgFile = body.profileImage;
            if (profileImgFile) {
                const isFile = typeof profileImgFile === 'object' && typeof profileImgFile.arrayBuffer === 'function';
                if (isFile) {
                    const res = await uploadToCloudinary(profileImgFile, `profile/${req.user.id}`);
                    updates.profileImage = res.url;
                } else if (typeof profileImgFile === 'string' && profileImgFile.trim().length > 0) {
                    updates.profileImage = profileImgFile.trim();
                }
            }

            // 2. Safe Date of Birth handling (prevent Mongoose CastError on empty strings)
            if (updates.dateOfBirth !== undefined) {
                if (!updates.dateOfBirth || updates.dateOfBirth === '') {
                    updates.dateOfBirth = null;
                } else {
                    const parsedDate = new Date(updates.dateOfBirth);
                    if (!isNaN(parsedDate.getTime())) {
                        updates.dateOfBirth = parsedDate;
                    } else {
                        delete updates.dateOfBirth;
                    }
                }
            }

            // 3. Emergency contacts normalization
            if (updates.emergencyContacts) {
                const list = Array.isArray(updates.emergencyContacts) ? updates.emergencyContacts : [updates.emergencyContacts];
                updates.emergencyContacts = list.map(c => ({
                    name: c?.name,
                    phone: c?.phone,
                    relationship: c?.relationship
                }));
            }

            // 4. Comma-separated array & primitive conversions
            if (updates.expertise && typeof updates.expertise === 'string') updates.expertise = updates.expertise.split(',').map(item => item.trim()).filter(Boolean);
            if (updates.medicalConditions && typeof updates.medicalConditions === 'string') updates.medicalConditions = updates.medicalConditions.split(',').map(item => item.trim()).filter(Boolean);
            if (updates.experience !== undefined) updates.experience = Number(updates.experience) || 0;

            // 5. Notifications boolean normalization
            if (updates.preferences?.notifications) {
                Object.keys(updates.preferences.notifications).forEach(key => {
                    const val = updates.preferences.notifications[key];
                    updates.preferences.notifications[key] = val === true || val === 'true' || val === '1' || val === 1;
                });
            }

            // 6. GeoJSON Point calculation
            if (updates.address) mapToGeoJSON(updates.address, 'location');

            // 7. Delegate profile update to BaseAuthService for standardized response payload & Redis caching
            const updatedProfile = await BaseAuthService.updateUserProfile(req.user.id, updates);

            if (updatedProfile?.email) UserEvents.emit(NOTIFICATION.KEY.USER.PROFILE.UPDATED, { identifier: updatedProfile.email, details: updatedProfile });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PERSONAL_UPDATED, updatedProfile);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * Dedicated endpoint to upload and update the user's avatar image.
     * Uploads the image binary directly to Cloudinary under the user's folder
     * and persists the secure image URL to the user profile and Redis cache.
     * 
     * @route POST /api/traveller/avatar
     * @route POST /api/vendor/avatar
     * @access Private (Authenticated User)
     * @param {import('next/server').NextRequest & { user: { id: string }, payload: { profileImage: File } }} req - Multipart request containing `profileImage`.
     * @returns {Promise<import('next/server').NextResponse>} Updated user profile data with new avatar URL.
     * @throws {400} If profileImage file is missing.
     * @throws {500} On Cloudinary upload or database update failure.
     */
    async updateProfileImage(req) {
        try {
            const file = req.payload?.profileImage;
            if (!file) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

            const result = await uploadToCloudinary(file, `profile/${req.user.id}`);
            const responseData = await BaseAuthService.updateUserProfile(req.user.id, { profileImage: result.url });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PERSONAL_AVATAR_UPDATED, responseData);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * Public profile lookup for a vendor's personal user identity.
     * Allows travellers or other users to view verified vendor credentials.
     * 
     * @route GET /api/traveller/profile/vendor/info/:userId
     * @access Public / Authenticated
     * @param {import('next/server').NextRequest} req - Incoming request.
     * @param {{ params: { userId: string } }} context - Route parameters containing vendor's user ID.
     * @returns {Promise<import('next/server').NextResponse>} Sanitized vendor user details.
     * @throws {404} If vendor user record does not exist.
     * @throws {500} On unexpected database error.
     */
    async getVendorProfile(req, { params }) {
        try {
            const user = await getUserById(params.userId);
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.USER.NOT_FOUND);
            const result = await userAuthResponse(user);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.USER.FETCHED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * Public lookup for a vendor's business entity and active package catalog.
     * Populates user details, associated inventory, and categorizes packages (homestay, hotel, trekking, etc.).
     * 
     * @route GET /api/traveller/profile/vendor/:businessId
     * @access Public / Authenticated
     * @param {import('next/server').NextRequest} req - Incoming request.
     * @param {{ params: { businessId: string } }} context - Route parameters containing vendor business ID.
     * @returns {Promise<import('next/server').NextResponse>} Business details along with catalog package items.
     * @throws {404} If business entity is not found.
     * @throws {500} On database query error.
     */
    async getBusinessProfile(req, { params }) {
        try {
            const business = await getBusinessById(params.businessId, '', { path: 'user' });
            if (!business) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
            const packages = await getPackageBy({ vendor: params.businessId }) || {};
            const items = itemsFormate(packages);
            const responseData = {
                ...businessPayload(business),
                items
            };
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, responseData);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * Upgrade the authenticated user's account role from Traveller to Vendor.
     * Initiates vendor onboarding and creates associated business records if absent.
     * 
     * @route POST /api/user/role/upgrade
     * @access Private (Authenticated Traveller)
     * @param {import('next/server').NextRequest & { user: { id: string } }} req - Authenticated request.
     * @returns {Promise<import('next/server').NextResponse>} Success message confirming role promotion.
     * @throws {401} If request is unauthenticated.
     * @throws {400} If role transition validation fails.
     */
    async upgradeToVendor(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            const result = await UserAuthService.upgradeToVendor(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.UPGRADED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
        }
    }

    /**
     * Downgrade the authenticated user's account role from Vendor to Traveller.
     * 
     * @route POST /api/user/role/downgrade
     * @access Private (Authenticated Vendor)
     * @param {import('next/server').NextRequest & { user: { id: string } }} req - Authenticated request.
     * @returns {Promise<import('next/server').NextResponse>} Success message confirming role demotion.
     * @throws {401} If request is unauthenticated.
     * @throws {400} If role transition validation fails.
     */
    async downgradeToTraveller(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            const result = await UserAuthService.downgradeToTraveller(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.DOWNGRADED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
        }
    }

    /**
     * Configure emergency contacts for the authenticated user for safety and SOS dispatch.
     * 
     * @route PUT /api/traveller/emergency-contacts
     * @access Private (Authenticated User)
     * @param {import('next/server').NextRequest & { user: { id: string }, payload: { emergencyContact: Array<{ name: string, phone: string, relationship?: string }> } }} req - Request containing contacts array.
     * @returns {Promise<import('next/server').NextResponse>} Success message confirming updated emergency contacts.
     * @throws {401} If unauthenticated.
     * @throws {400} If emergencyContact array is invalid or missing.
     * @throws {500} If update fails.
     */
    async updateEmergencyContacts(req) {
        try {
            const user = req.user;
            if (!user) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);

            const body = req.payload || {};

            let emergencyContacts = null;
            if (Array.isArray(body.emergencyContacts)) emergencyContacts = body.emergencyContacts;
            else if (Array.isArray(body.emergencyContact)) emergencyContacts = body.emergencyContact;

            if (!emergencyContacts) return this.error(HTTP_STATUS.BAD_REQUEST, 'emergencyContacts must be an array.');
            await SOSService.updateEmergencyContacts(user.id, emergencyContacts);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SOS.CONTACTS_UPDATED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * Trigger a critical emergency SOS alert for the authenticated user.
     * Captures real-time GPS coordinates, notifies registered emergency contacts,
     * and alerts the PahadiGo safety response team.
     * 
     * @route POST /api/traveller/sos
     * @route POST /api/vendor/sos
     * @access Private (Authenticated User)
     * @param {import('next/server').NextRequest & { user: { id: string }, payload: { latitude: number, longitude: number, accuracy?: number, address?: string } }} req - Request containing GPS location data.
     * @returns {Promise<import('next/server').NextResponse>} Created SOS alert payload with dispatch status.
     * @throws {500} On SOS dispatch error.
     */
    async triggerSOS(req) {
        try {
            const location = req.payload;
            const alert = await SOSService.triggerSOS(req.user.id, location);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SOS.ALERT_TRIGGERED, alert);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }


    /**
     * Diagnostic and operational dashboard overview for the authenticated vendor.
     * Aggregates verification state, catalog inventory readiness, financial withholding metrics,
     * review ratings, dispute counters, closure periods, and onboarding checklist.
     * 
     * ### Financial Metrics & Rules:
     * - **withdrawnAmount**: Total payout eligible for release. Criteria:
     *   - Booking status: `COMPLETED`
     *   - Completion cutoff: `endDate` or `verification.endVerifiedAt` <= 3 days ago
     *   - Payout status: Not already `paid`
     *   - Net calculation: Deducts 10% platform commission + 18% GST on commission (1.8%), yielding `amount * 0.882`
     * - **pendingAmount**: Funds in holding (completed < 3 days ago or active paid bookings), net of 11.8% commission & GST (`amount * 0.882`).
     * - **totalRevenue**: Gross transaction volume of all paid bookings.
     * - **earnings**: Gross sum of completed booking revenues.
     * 
     * @route GET /api/vendor/profile/check
     * @access Private (Authenticated Vendor)
     * @param {import('next/server').NextRequest & { user: { id: string } }} req - Authenticated vendor request.
     * @returns {Promise<import('next/server').NextResponse>} Comprehensive operational & onboarding dashboard payload:
     * `{ isVerified: boolean, status: boolean, vendor: { isOperating, isApproved, status, trustBadge, category, bankDetails, documents, packages, packageSummary, bookingStats, closurePeriods, rating, disputes, onboarding, payoutSetup, unreadNotifications } | null }`
     * @throws {404} If user record is not found.
     * @throws {500} On database aggregation or server error.
     */
    async checkProfile(req) {
        try {
            let userId = req.user?.id;
            const [user, vendor] = await Promise.all([
                getUserById(userId, 'isVerified status isVendorVerified'),
                getBusinessByUserId(userId, 'isOperating isApproved status trustBadge category bankDetails documents address businessName ownerName rating', null)
            ]);

            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.USER.NOT_FOUND);

            let vendorData = null;

            if (vendor) {
                let vendorObjectId = vendor._id;
                try {
                    vendorObjectId = new mongoose.Types.ObjectId(vendor._id);
                } catch (e) { }

                let userObjectId = userId;
                try {
                    userObjectId = new mongoose.Types.ObjectId(userId);
                } catch (e) { }

                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);
                const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

                const packageProjection = 'homestay._id homestay.isActive hotel._id hotel.isActive camping._id camping.isActive trekking._id trekking.isActive rafting._id rafting.isActive bungeeJumping._id bungeeJumping.isActive vehicleRental._id vehicleRental.isActive chardhamTour._id chardhamTour.isActive customTrip._id customTrip.isActive';

                // 2. Concurrently fetch Package catalog, Booking aggregation stats, Vendor documents, Reviews, Disputes & Notifications
                const [pkg, bookingStatsResult, hasCategoryDocsCheck, reviewStatsResult, disputeStatsResult, unreadCount] = await Promise.all([
                    getPackageBy({ vendor: vendor._id }, packageProjection),
                    Booking.aggregate([
                        { $match: { vendor: vendorObjectId } },
                        {
                            $project: {
                                status: 1,
                                startDate: 1,
                                endDate: 1,
                                paymentStatus: 1,
                                'pricing.total': 1,
                                'payout.amount': 1,
                                'payout.status': 1,
                                'verification.endVerifiedAt': 1
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalBookings: { $sum: 1 },
                                confirmedBookings: { $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.CONFIRMED] }, 1, 0] } },
                                todayBookings: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $gte: ["$startDate", startOfToday] },
                                                    { $lte: ["$startDate", endOfToday] },
                                                    { $in: ["$status", [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ONGOING]] }
                                                ]
                                            },
                                            1,
                                            0
                                        ]
                                    }
                                },
                                cancelledBookings: { $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.CANCELLED] }, 1, 0] } },
                                completedBookings: { $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.COMPLETED] }, 1, 0] } },
                                pendingBookings: { $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.PENDING] }, 1, 0] } },
                                ongoingBookings: { $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.ONGOING] }, 1, 0] } },
                                totalRevenue: {
                                    $sum: {
                                        $cond: [
                                            { $in: ["$paymentStatus", [PAYMENT_STATUS.PAID, 'paid']] },
                                            { $ifNull: ["$pricing.total", 0] },
                                            0
                                        ]
                                    }
                                },
                                withdrawnAmount: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ["$status", BOOKING_STATUS.COMPLETED] },
                                                    { $ne: ["$payout.status", 'paid'] },
                                                    {
                                                        $or: [
                                                            { $lte: ["$endDate", threeDaysAgo] },
                                                            { $lte: ["$verification.endVerifiedAt", threeDaysAgo] }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $multiply: [
                                                    {
                                                        $cond: [
                                                            { $gt: [{ $ifNull: ["$payout.amount", 0] }, 0] },
                                                            "$payout.amount",
                                                            { $ifNull: ["$pricing.total", 0] }
                                                        ]
                                                    },
                                                    0.882
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                },
                                pendingAmount: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $ne: ["$payout.status", 'paid'] },
                                                    {
                                                        $or: [
                                                            {
                                                                $and: [
                                                                    { $eq: ["$status", BOOKING_STATUS.COMPLETED] },
                                                                    { $gt: ["$endDate", threeDaysAgo] }
                                                                ]
                                                            },
                                                            {
                                                                $and: [
                                                                    { $in: ["$paymentStatus", [PAYMENT_STATUS.PAID, 'paid']] },
                                                                    { $in: ["$status", [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ONGOING, BOOKING_STATUS.PENDING]] }
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $multiply: [
                                                    {
                                                        $cond: [
                                                            { $gt: [{ $ifNull: ["$payout.amount", 0] }, 0] },
                                                            "$payout.amount",
                                                            { $ifNull: ["$pricing.total", 0] }
                                                        ]
                                                    },
                                                    0.882
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                },
                                earnings: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ["$status", BOOKING_STATUS.COMPLETED] },
                                            { $ifNull: ["$pricing.total", 0] },
                                            0
                                        ]
                                    }
                                }
                            }
                        }
                    ]),
                    getVendorDocumentsBy({ vendor: vendor._id }, '_id', null, null, { limit: 1 }),
                    Review.aggregate([
                        { $match: { vendor: vendorObjectId, isVisible: true } },
                        {
                            $group: {
                                _id: null,
                                avgRating: { $avg: "$rating" },
                                totalReviews: { $sum: 1 }
                            }
                        }
                    ]),
                    Dispute.aggregate([
                        { $match: { vendor: vendorObjectId } },
                        {
                            $group: {
                                _id: null,
                                openDisputes: {
                                    $sum: {
                                        $cond: [{ $in: ["$status", ["open", "investigating"]] }, 1, 0]
                                    }
                                },
                                resolvedDisputes: {
                                    $sum: {
                                        $cond: [{ $in: ["$status", ["resolved_refunded", "resolved_rejected"]] }, 1, 0]
                                    }
                                }
                            }
                        }
                    ]),
                    NotificationService.getUnreadCount(userId).catch(() => 0)
                ]);
                const stats = bookingStatsResult?.[0] || {};
                const bookingStats = {
                    totalBookings: stats.totalBookings || 0,
                    confirmedBookings: stats.confirmedBookings || 0,
                    todayBookings: stats.todayBookings || 0,
                    cancelledBookings: stats.cancelledBookings || 0,
                    completedBookings: stats.completedBookings || 0,
                    pendingBookings: stats.pendingBookings || 0,
                    ongoingBookings: stats.ongoingBookings || 0,
                    totalRevenue: Math.round((stats.totalRevenue || 0) * 100) / 100,
                    withdrawnAmount: Math.round((stats.withdrawnAmount || 0) * 100) / 100,
                    pendingAmount: Math.round((stats.pendingAmount || 0) * 100) / 100,
                    earnings: Math.round((stats.earnings || 0) * 100) / 100
                };

                const closures = vendor.closurePeriods || [];
                const closurePeriods = closures.map(c => ({
                    startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
                    endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
                    reason: c.reason || 'Maintenance'
                }));

                const packageCategories = ['homestay', 'hotel', 'camping', 'trekking', 'rafting', 'bungeeJumping', 'vehicleRental', 'chardhamTour', 'customTrip'];
                let totalPackageItems = 0;
                let activePackageItems = 0;

                packageCategories.forEach(key => {
                    if (Array.isArray(pkg?.[key])) {
                        totalPackageItems += pkg[key].length;
                        activePackageItems += pkg[key].filter(item => item.isActive !== false).length;
                    }
                });

                const packages = {
                    homestay: Boolean(pkg?.homestay && pkg.homestay.length > 0),
                    hotel: Boolean(pkg?.hotel && pkg.hotel.length > 0),
                    camping: Boolean(pkg?.camping && pkg.camping.length > 0),
                    trekking: Boolean(pkg?.trekking && pkg.trekking.length > 0),
                    rafting: Boolean(pkg?.rafting && pkg.rafting.length > 0),
                    bungeeJumping: Boolean(pkg?.bungeeJumping && pkg.bungeeJumping.length > 0),
                    vehicleRental: Boolean(pkg?.vehicleRental && pkg.vehicleRental.length > 0),
                    chardhamTour: Boolean(pkg?.chardhamTour && pkg.chardhamTour.length > 0),
                    customTrip: Boolean(pkg?.customTrip && pkg.customTrip.length > 0)
                };

                const packageSummary = {
                    totalItems: totalPackageItems,
                    activeItems: activePackageItems
                };

                const reviewStats = reviewStatsResult?.[0] || {};
                const rating = {
                    average: reviewStats.avgRating ? Math.round(reviewStats.avgRating * 10) / 10 : (vendor.rating?.average || 0),
                    count: reviewStats.totalReviews || (vendor.rating?.count || 0)
                };

                const disputeStats = disputeStatsResult?.[0] || {};
                const disputes = {
                    open: disputeStats.openDisputes || 0,
                    resolved: disputeStats.resolvedDisputes || 0
                };

                const hasPan = Boolean(vendor.documents?.panCard?.url || vendor.personalPanCard);
                const hasAadhar = Array.isArray(vendor.documents?.aadharCard) && vendor.documents.aadharCard.some(d => Boolean(d?.url));
                const hasCategoryDocs = Boolean(hasCategoryDocsCheck && hasCategoryDocsCheck?.length > 0);
                const hasDocuments = Boolean((hasPan && hasAadhar) || hasCategoryDocs);
                const hasBasicInfo = Boolean(vendor.businessName && vendor.ownerName);
                const hasAddress = Boolean((vendor.address?.addressLine1 || vendor.address?.city) && vendor.address?.state);
                const hasCategory = Boolean(vendor.category && Array.isArray(vendor.category) && vendor.category.length > 0);
                const hasBankDetails = Boolean(vendor.bankDetails?.accountNumber && vendor.bankDetails?.ifscCode);
                const hasPackages = Object.values(packages).some(Boolean);

                const checklist = [hasBasicInfo, hasAddress, hasCategory, hasDocuments, hasBankDetails, hasPackages];
                const completedSteps = checklist.filter(Boolean).length;
                const profileCompletion = Math.round((completedSteps / checklist.length) * 100);
                const isReadyToAcceptBookings = Boolean(vendor.isOperating && vendor.isApproved && (vendor.status === STATUS.ACTIVE || vendor.status === 'active' || vendor.status === 'verified') && hasBankDetails && hasPackages);

                const onboarding = {
                    profileCompletion,
                    isReadyToAcceptBookings,
                    steps: {
                        basicInfo: hasBasicInfo,
                        address: hasAddress,
                        category: hasCategory,
                        documents: hasDocuments,
                        bankDetails: hasBankDetails,
                        packages: hasPackages
                    }
                };

                const payoutSetup = {
                    isFundAccountLinked: Boolean(vendor.bankDetails?.razorpayFundAccountId),
                    hasCancelledCheque: Boolean(vendor.bankDetails?.cancelledCheque?.url)
                };

                vendorData = {
                    isOperating: Boolean(vendor.isOperating),
                    isApproved: Boolean(vendor.isApproved),
                    status: Boolean(vendor.status === STATUS.ACTIVE || vendor.status === 'active' || vendor.status === 'verified'),
                    trustBadge: Boolean(vendor.trustBadge && vendor.trustBadge !== 'none'),
                    category: hasCategory,
                    bankDetails: hasBankDetails,
                    documents: hasDocuments,
                    packages,
                    packageSummary,
                    bookingStats,
                    closurePeriods,
                    rating,
                    disputes,
                    onboarding,
                    payoutSetup,
                    unreadNotifications: Number(unreadCount) || 0
                };
            }

            const responsePayload = {
                isVerified: Boolean(user.isVerified),
                status: Boolean(user.status === STATUS.ACTIVE),
                vendor: vendorData
            };

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, responsePayload);
        } catch (error) {
            console.log(error);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const profileController = new ProfileController();
export default profileController;
