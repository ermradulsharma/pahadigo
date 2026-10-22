import mongoose from 'mongoose';
import User from '@/core/Models/User.js';
import Booking from '@/core/Models/Booking.js';
import Review from '@/core/Models/Review.js';
import Dispute from '@/core/Models/Dispute.js';
import Notification from '@/core/Models/Notification.js';
import { BaseAuthService, UserAuthService } from '@/core/Services/Auth/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, STATUS, BOOKING_STATUS, PAYMENT_STATUS, PAYOUT_STATUS } from '@/core/Constants/index.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { businessPayload, getBusinessById, getBusinessByUserId, getPackageBy, getUserById, getVendorDocumentsBy, itemsFormate, transformAuthResponse, userAuthResponse } from '@/core/Helpers/index.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import Controller from '@/core/Controllers/Controller.js';
import UserEvents from '@/core/Events/UserEvents.js';

import CacheService from '@/core/Services/CacheService.js';
import SOSService from '@/core/Services/General/SOSService.js';
import { getLogger } from '@/core/Lib/logger.js';
import { NOTIFICATION } from '@/core/Constants/notification';

/**
 * ProfileController (Vendor Role) - Specialized management of
 * the vendor's personal account, identity, and personal contact info.
 */
class ProfileController extends Controller {

    // GET user profile /traveller/me or /vendor/me
    async getProfile(req) {
        try {
            const userId = req.user.id;
            const user = await User.findById(userId);
            const result = await userAuthResponse(user);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /traveller/status or /vendor/status
    async toggleAccountStatus(req) {
        try {
            const { status } = req.payload;
            if (typeof status !== 'boolean') return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.INVALID_REQUEST);

            const user = await User.findById(req.user.id);
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND);
            if (status === true && (user.status === STATUS.BLOCKED || user.status === STATUS.SUSPENDED)) return this.error(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.VENDOR.ACCOUNT_RESTRICTED);
            if (status === true) user.status = user.isVerified === true ? STATUS.ACTIVE : STATUS.PENDING;
            else user.status = STATUS.INACTIVE;
            await user.save();
            const message = status ? RESPONSE_MESSAGES.AUTH.ACTIVATED : RESPONSE_MESSAGES.AUTH.DEACTIVATED;
            return this.success(HTTP_STATUS.OK, message);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // PATCH /traveller/update or /vendor/update 
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

    // POST /traveller/avatar or /vendor/avatar
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

    // GET /traveller/profile/vendor/info/:userId
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

    // GET /traveller/profile/vendor/:businessId
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

    async upgradeToVendor(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            await UserAuthService.upgradeToVendor(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.UPGRADED);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
        }
    }

    async downgradeToTraveller(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            await UserAuthService.downgradeToTraveller(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.DOWNGRADED);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
        }
    }

    async updateEmergencyContacts(req) {
        try {
            const user = req.user;
            if (!user) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);

            const body = req.payload;

            let emergencyContacts = null;
            if (Array.isArray(body.emergencyContact)) emergencyContacts = body.emergencyContact;
            if (!emergencyContacts) return this.error(HTTP_STATUS.BAD_REQUEST, 'emergencyContacts must be an array.');
            await SOSService.updateEmergencyContacts(user.id, emergencyContacts);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SOS.CONTACTS_UPDATED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    /**
     * POST /traveller/sos or /vendor/sos
     * Triggers an SOS emergency alert for any authenticated user.
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
     * GET /api/vendor/profile/check
     * Provides comprehensive operational, verification, catalog, and booking statistics
     * for the authenticated vendor and user account.
     */
    async checkProfile(req) {
        try {
            let userId = req.user?.id;
            const [user, vendor] = await Promise.all([
                getUserById(userId),
                getBusinessByUserId(userId, '', null)
            ]);

            if (!user) {
                return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.USER.NOT_FOUND);
            }

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

                // 2. Concurrently fetch Package catalog, Booking aggregation stats, Vendor documents, Reviews, Disputes & Notifications
                const [pkg, bookingStatsResult, vendorDocs, reviewStatsResult, disputeStatsResult, unreadCount] = await Promise.all([
                    getPackageBy({ vendor: vendor._id }),
                    Booking.aggregate([
                        { $match: { vendor: vendorObjectId } },
                        {
                            $group: {
                                _id: null,
                                totalBookings: { $sum: 1 },
                                confirmedBookings: {
                                    $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.CONFIRMED] }, 1, 0] }
                                },
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
                                cancelledBookings: {
                                    $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.CANCELLED] }, 1, 0] }
                                },
                                completedBookings: {
                                    $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.COMPLETED] }, 1, 0] }
                                },
                                pendingBookings: {
                                    $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.PENDING] }, 1, 0] }
                                },
                                ongoingBookings: {
                                    $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.ONGOING] }, 1, 0] }
                                },
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
                    getVendorDocumentsBy({ vendor: vendor._id }),
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
                    Notification.countDocuments({ recipient: userObjectId, isRead: false, isDeleted: false })
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
                const hasCategoryDocs = Array.isArray(vendorDocs) && vendorDocs.length > 0;
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
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const profileController = new ProfileController();
export default profileController;
