import mongoose from 'mongoose';
import { sanitizeHTML, redactSensitiveData } from '@/helpers/security.js';
import { getStartDateByPeriod } from '@/helpers/dateUtils.js';
import { getRequestMetadata } from '@/helpers/requestUtils.js';
import User from '@/models/User.js';
import Vendor from '@/models/Vendor.js';
import Booking from '@/models/Booking.js';
import Package from '@/models/Package.js';
import Category from '@/models/Category.js';
import Policy from '@/models/Policy.js';
import Review from '@/models/Review.js';
import Banner from '@/models/Banner.js';
import Coupon from '@/models/Coupon.js';
import Inquiry from '@/models/Inquiry.js';
import AuditLog from '@/models/AuditLog.js';
import SearchLog from '@/models/SearchLog.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';
import { SCHEMA_KEYS } from '@/constants/categories.js';
import { mapToGeoJSON } from '@/helpers/geoUtils.js';

class AdminService {
    // ... existing stats ...

    async getMapAnalyticsData() {
        // Aggregate users by address.country
        const userDistribution = await User.aggregate([
            { $match: { role: 'traveller' } },
            { $group: { _id: "$address.country", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } }
        ]);

        // Aggregate bookings by package location (assuming package has location or similar)
        // Let's check package model later, for now assuming we can link via package -> vendor -> address or package.destination
        // If package has destination field.

        return {
            userDistribution: userDistribution.map(u => ({ id: u._id, value: u.count })),
            // topDestinations: ...
        };
    }

    async getCalendarEvents(start, end) {
        const query = {};
        if (start && end) {
            query.travelDate = { $gte: new Date(start), $lte: new Date(end) };
        }

        const bookingEvents = await Booking.find(query)
            .select('travelDate status user package')
            .populate('user', 'name')
            .populate('package', 'title');

        return bookingEvents.map(b => ({
            id: b._id,
            title: `${b.user?.name || 'User'} - ${b.package?.title || 'Trip'}`,
            start: b.travelDate,
            end: b.travelDate, // Assuming 1 day or need duration
            status: b.status,
            type: 'booking'
        }));
    }

    async getSearchAnalytics() {
        const topSearches = await SearchLog.aggregate([
            { $group: { _id: "$query", count: { $sum: "$count" }, results: { $avg: "$resultsCount" } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        const zeroResultSearches = await SearchLog.aggregate([
            { $match: { resultsCount: 0 } },
            { $group: { _id: "$query", count: { $sum: "$count" } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        return { topSearches, zeroResultSearches };
    }

    async getFinancialStats() {
        // Total Revenue (Paid bookings)
        const revenue = await Booking.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);

        // Pending Payouts (Paid by user, but not paid to vendor)
        const pendingPayouts = await Booking.aggregate([
            { $match: { paymentStatus: 'paid', payoutStatus: 'pending' } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } } // Assuming 100% payout for simplified logic, or add commission logic
        ]);

        // Refunds
        const refunds = await Booking.aggregate([
            { $match: { refundStatus: 'refunded' } },
            { $group: { _id: null, total: { $sum: "$refundAmount" } } }
        ]);

        return {
            totalRevenue: revenue[0]?.total || 0,
            pendingPayouts: pendingPayouts[0]?.total || 0,
            refundsProcessed: refunds[0]?.total || 0,
            // netProfit: ... (Revenue - Payouts)
        };
    }

    async getSystemHealth() {
        // Mock health metrics based on logs
        const errorCount = await AuditLog.countDocuments({ action: 'ERROR', createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }); // Last 24h
        const activeUsers = await User.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } }); // "Active" in last 15 mins (approx)

        return {
            errorRate24h: errorCount,
            activeUsers
        };
    }

    async getDashboardStats() {
        const [userCount, vendorCount, verifiedVendorCount, pendingVendorCount, bookingCount, categoryCount, revenue, recentBookings, recentVendors] = await Promise.all([
            User.countDocuments({ role: 'traveller' }),
            User.countDocuments({ role: 'vendor' }),
            Vendor.countDocuments({ isApproved: true }),
            Vendor.countDocuments({ isApproved: false }),
            Booking.countDocuments(),
            Category.countDocuments(),
            Booking.aggregate([
                { $match: { paymentStatus: 'paid', refundStatus: 'none' } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]),
            Booking.find().sort({ bookingDate: -1 }).limit(5)
                .populate('user', 'name')
                .populate({ path: 'package', select: 'title' }),
            Vendor.find().sort({ createdAt: -1 }).limit(5)
                .populate('user', 'email')
        ]);

        // Aggregate total items in all service categories across all vendors
        const packageItemsStats = await Package.aggregate([
            {
                $project: {
                    totalItems: {
                        $add: [
                            ...SCHEMA_KEYS.map(key => ({ $size: { $ifNull: [`$${key}`, []] } }))
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalCount: { $sum: "$totalItems" }
                }
            }
        ]);

        const packageCount = packageItemsStats[0]?.totalCount || 0;

        return {
            users: userCount,
            totalVendors: vendorCount,
            vendors: verifiedVendorCount,
            pendingVendors: pendingVendorCount,
            bookings: bookingCount,
            packages: packageCount,
            categories: categoryCount,
            revenue: revenue[0] ? revenue[0].total : 0,
            recentBookings,
            recentVendors
        };
    }


    async getAllBookings() {
        return await Booking.find()
            .populate('user', 'name email')
            .populate({
                path: 'package',
                populate: { path: 'vendor', select: 'businessName bankDetails' }
            })
            .sort({ bookingDate: -1 });
    }

    async getAllVendors() {
        const users = await User.find({ role: 'vendor' }).lean();
        const profiles = await Vendor.find().lean();
        const profileMap = new Map(profiles.map(p => [p.user?.toString(), p]));
        return users.map(u => {
            const profile = profileMap.get(u._id.toString());
            if (profile) {
                return { ...profile, user: u, hasProfile: true };
            }
            return {
                _id: u._id,
                user: u,
                businessName: 'Profile Pending',
                isApproved: false,
                category: [],
                hasProfile: false,
                createdAt: u.createdAt
            };
        });
    }

    async getAllTravellers() {
        return await User.find({ role: 'traveller' }).select('name email phone createdAt isVerified status');
    }

    async createTraveller(data, req = null) {
        const existing = await User.findOne({ email: data.email });
        if (existing) throw new Error(RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS);

        const user = await User.create({
            ...data,
            role: 'traveller',
            isVerified: true, // Auto-verify admin created users
            status: 'active'
        });

        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'CREATE', 'USER', user._id, { email: user.email }, req);
        }
        return user;
    }

    async approveVendor(vendorId) {
        return await Vendor.findByIdAndUpdate(vendorId, { isApproved: true }, { returnDocument: 'after' });
    }

    async updateVendor(id, data, req = null) {
        try {
            // id could be Vendor._id or User._id
            let vendor = await Vendor.findById(id);
            let user = null;

            if (vendor) {
                user = await User.findById(vendor.user).lean();
            } else {
                // It might be a user id instead
                user = await User.findById(id).lean();
                if (user) {
                    vendor = await Vendor.findOne({ user: id });
                }
            }

            if (!vendor && !user) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

            // ... separate logic ...
            const userFields = [
                'name', 'phone', 'gender', 'dateOfBirth', 'designation',
                'bio', 'website', 'socialLinks', 'expertise',
                'emergencyContact', 'address', 'preferences', 'status', 'isVerified'
            ];
            const vendorFields = [
                'ownerName', 'personalNumber', 'personalPanCard', 'personalAbout',
                'businessName', 'businessNumber', 'businessRegistration', 'gstNumber',
                'businessAbout', 'address', 'isApproved', 'bankDetails', 'documents', 'category'
            ];

            const userData = {};
            const vendorUpdateData = {};

            Object.keys(data).forEach(key => {
                if (userFields.includes(key)) userData[key] = data[key];
                if (vendorFields.includes(key)) vendorUpdateData[key] = data[key];
            });

            if (Object.keys(vendorUpdateData).length > 0) {
                if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

                const finalVendorUpdate = {};
                ['ownerName', 'personalNumber', 'personalPanCard', 'personalAbout',
                    'businessName', 'businessNumber', 'businessRegistration', 'gstNumber',
                    'businessAbout', 'isApproved', 'category'].forEach(field => {
                        if (vendorUpdateData[field] !== undefined) finalVendorUpdate[field] = vendorUpdateData[field];
                    });

                if (vendorUpdateData.address) {
                    finalVendorUpdate.address = { ...(vendor.address || {}), ...vendorUpdateData.address };
                    mapToGeoJSON(finalVendorUpdate.address, 'location');
                }

                if (vendorUpdateData.bankDetails) {
                    finalVendorUpdate.bankDetails = { ...(vendor.bankDetails || {}), ...vendorUpdateData.bankDetails };
                }

                if (vendorUpdateData.documents) {
                    finalVendorUpdate.documents = { ...(vendor.documents || {}), ...vendorUpdateData.documents };
                }

                await Vendor.findByIdAndUpdate(vendor._id, { $set: finalVendorUpdate });
            }

            if (user && Object.keys(userData).length > 0) {
                const userUpdate = {};
                ['name', 'phone', 'gender', 'dateOfBirth', 'designation', 'bio', 'website', 'expertise', 'status', 'isVerified'].forEach(field => {
                    if (userData[field] !== undefined) userUpdate[field] = userData[field];
                });

                if (userData.socialLinks) userUpdate.socialLinks = { ...(user.socialLinks || {}), ...userData.socialLinks };
                if (userData.emergencyContact) userUpdate.emergencyContact = { ...(user.emergencyContact || {}), ...userData.emergencyContact };
                if (userData.address) {
                    userUpdate.address = { ...(user.address || {}), ...userData.address };
                    mapToGeoJSON(userUpdate.address, 'location');
                }
                if (userData.preferences) {
                    const existingPrefs = user.preferences || {};
                    const newPrefs = userData.preferences || {};
                    userUpdate.preferences = {
                        ...existingPrefs,
                        ...newPrefs,
                        notifications: {
                            ...(existingPrefs.notifications || {}),
                            ...(newPrefs.notifications || {})
                        }
                    };
                }

                await User.findByIdAndUpdate(user._id, { $set: userUpdate });
            }

            if (req && req.user) {
                const adminId = req.user.id || req.user._id;
                await this.logAction(adminId, 'UPDATE', 'VENDOR', id, { changes: data }, req);
            }

            if (vendor) {
                return await Vendor.findById(vendor._id).populate('user');
            } else {
                return await User.findById(user._id);
            }
        } catch (error) {
            throw error;
        }
    }

    async getPaymentHistory() {
        const bookings = await Booking.find({
            $or: [{ paymentStatus: 'paid' }, { refundStatus: 'refunded' }]
        })
            .populate('user', 'name')
            .populate({ path: 'package', select: 'title vendor', populate: { path: 'vendor', select: 'businessName' } })
            .sort({ bookingDate: -1 });

        return bookings.map(b => {
            const events = [];
            if (b.paymentStatus === 'paid') {
                events.push({
                    id: b._id + '_in',
                    type: 'inflow',
                    amount: b.totalPrice,
                    date: b.bookingDate,
                    description: `Payment from ${b.user?.name || 'User'} for ${b.package?.title || 'Package'}`,
                    status: 'completed'
                });
            }

            if (b.refundStatus === 'refunded') {
                events.push({
                    id: b._id + '_refund',
                    type: 'outflow',
                    amount: b.totalPrice,
                    date: new Date(),
                    description: `Refund to ${b.user?.name || 'User'}`,
                    status: 'refunded'
                });
            }

            if (b.payoutStatus === 'paid' && b.refundStatus !== 'refunded') {
                events.push({
                    id: b._id + '_payout',
                    type: 'outflow',
                    amount: b.totalPrice,
                    date: new Date(),
                    description: `Payout to ${b.package?.vendor?.businessName || 'Vendor'}`,
                    status: 'paid_out'
                });
            }
            return events;
        }).flat();
    }

    async getPolicies(target = null) {
        const filter = target ? { target } : {};
        return await Policy.find(filter);
    }

    async getPolicy(target, type) {
        return await Policy.findOne({ target, type });
    }

    async updatePolicy(target, type, content, adminId) {
        // [SECURITY] Sanitize HTML content before saving to prevent Stored XSS
        const sanitizedContent = sanitizeHTML(content);

        return await Policy.findOneAndUpdate(
            { target, type },
            {
                content: sanitizedContent,
                lastUpdatedBy: adminId
            },
            {
                returnDocument: 'after',
                upsert: true
            }
        );
    }

    async getAllServices() {
        const packages = await Package.find().populate({
            path: 'vendor',
            select: 'businessName'
        });
        const allServices = [];
        const categories = SCHEMA_KEYS;
        packages.forEach(pkg => {
            categories.forEach(type => {
                if (Array.isArray(pkg[type])) {
                    pkg[type].forEach(service => {
                        allServices.push({
                            ...service.toObject(),
                            serviceType: type,
                            vendor: pkg.vendor,
                            vendorId: pkg.vendor?._id?.toString() || pkg.vendor?.toString() || null
                        });
                    });
                }
            });
        });

        return allServices;
    }

    async toggleServiceStatus(vendorId, serviceType, serviceId, status, req = null) {
        const pkg = await Package.findOne({ vendor: vendorId });
        if (!pkg) throw new Error(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

        const services = pkg[serviceType];
        if (!services) throw new Error(`Service type ${serviceType} not found`);

        const serviceIndex = services.findIndex(s => s._id.toString() === serviceId);
        if (serviceIndex === -1) throw new Error(RESPONSE_MESSAGES.ITEM.NOT_FOUND);

        pkg[serviceType][serviceIndex].isActive = status;
        pkg.markModified(serviceType);
        await pkg.save();

        // Audit Log
        const adminId = req?.user?.id || req?.user?._id;
        if (adminId) this.logAction(adminId, 'UPDATE_STATUS', 'INVENTORY', serviceId, { status: status }, req);

        return pkg[serviceType][serviceIndex];
    }

    async getAllReviews() {
        return await Review.find()
            .populate('user', 'name profileImage')
            .populate('vendor', 'businessName')
            .sort({ createdAt: -1 });
    }

    async toggleReviewVisibility(reviewId, isVisible, req = null) {
        const review = await Review.findByIdAndUpdate(
            reviewId,
            { isVisible },
            { returnDocument: 'after' }
        );
        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'UPDATE_VISIBILITY', 'REVIEW', reviewId, { isVisible }, req);
        }
        return review;
    }

    async deleteReview(reviewId, req = null) {
        const result = await Review.findByIdAndDelete(reviewId);
        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'DELETE', 'REVIEW', reviewId, {}, req);
        }
        return result;
    }

    // --- Banners ---

    async createBanner(data, req = null) {
        const banner = await Banner.create(data);
        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'CREATE', 'BANNER', banner._id, { title: banner.title }, req);
        }
        return banner;
    }

    async getBanners() {
        return await Banner.find().sort({ position: 1, createdAt: -1 });
    }

    async updateBanner(id, data, req = null) {
        const banner = await Banner.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'UPDATE', 'BANNER', id, { changes: data }, req);
        }
        return banner;
    }

    async deleteBanner(id, req = null) {
        const result = await Banner.findByIdAndDelete(id);
        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'DELETE', 'BANNER', id, {}, req);
        }
        return result;
    }

    // --- Coupons ---

    async createCoupon(data, req = null) {
        const coupon = await Coupon.create(data);
        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'CREATE', 'COUPON', coupon._id, { code: coupon.code }, req);
        }
        return coupon;
    }

    async getCoupons() {
        return await Coupon.find().sort({ createdAt: -1 });
    }

    async updateCoupon(id, data, req = null) {
        const coupon = await Coupon.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'UPDATE', 'COUPON', id, { changes: data }, req);
        }
        return coupon;
    }

    async deleteCoupon(id, req = null) {
        const result = await Coupon.findByIdAndDelete(id);
        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'DELETE', 'COUPON', id, {}, req);
        }
        return result;
    }

    // --- Support & Inquiries ---

    async submitInquiry(data) {
        return await Inquiry.create(data);
    }

    async getInquiries() {
        return await Inquiry.find().sort({ createdAt: -1 });
    }

    async updateInquiry(id, data) {
        return await Inquiry.findByIdAndUpdate(id, data, { returnDocument: 'after' });
    }

    async deleteInquiry(id) {
        return await Inquiry.findByIdAndDelete(id);
    }

    // --- Analytics ---

    async getAnalyticsData(period = 'monthly') {
        const startDate = getStartDateByPeriod(period);

        const [revenueData, bookingStatus, userGrowth, topVendors] = await Promise.all([
            Booking.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        revenue: { $sum: "$totalPrice" },
                        bookings: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Booking.aggregate([
                { $group: { _id: "$status", value: { $sum: 1 } } }
            ]),
            User.aggregate([
                { $match: { createdAt: { $gte: startDate }, role: { $in: ['traveller', 'vendor'] } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        users: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Booking.aggregate([
                { $match: { status: 'completed' } },
                {
                    $group: {
                        _id: "$package",
                        revenue: { $sum: "$totalPrice" },
                        bookings: { $sum: 1 }
                    }
                },
                { $sort: { revenue: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "packages",
                        localField: "_id",
                        foreignField: "_id",
                        as: "packageDetails"
                    }
                },
                { $unwind: "$packageDetails" },
                {
                    $project: {
                        name: "$packageDetails.title",
                        revenue: 1,
                        bookings: 1
                    }
                }
            ])
        ]);

        return {
            revenueData,
            bookingStatus: bookingStatus.map(b => ({ name: b._id, value: b.value })),
            userGrowth,
            topVendors
        };
    }

    // --- Audit Logs ---

    /**
     * Log an admin action.
     * @param {string} adminId - The user ID of the admin.
     * @param {string} action - 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', etc.
     * @param {string} target - 'REVIEW', 'BANNER', 'PROVIDER', 'USER'.
     * @param {string} targetId - The ID of the affected resource.
     * @param {object} details - Any metadata to store (e.g. changed fields).
     * @param {object} req - Optional: To extract IP/UA if passed.
     */
    async logAction(adminId, action, target, targetId, details, req = null, session = null) {
        try {
            const sanitizedDetails = redactSensitiveData(details);
            const { ipAddress, userAgent } = getRequestMetadata(req);

            const log = new AuditLog({
                adminId: adminId,
                action,
                target,
                targetId,
                details: sanitizedDetails,
                ipAddress,
                userAgent
            });
            await log.save({ session });
        } catch (error) {
            console.error("Failed to write audit log:", error);
            // Non-blocking: Don't throw, just log the error.
        }
    }

    async getAuditLogs(filter = {}, page = 1, limit = 20) {
        const safeLimit = Math.max(1, Math.min(parseInt(limit) || 20, 500));
        const skip = (Math.max(1, parseInt(page) || 1) - 1) * safeLimit;
        const query = {};

        if (filter.adminId) query.adminId = filter.adminId;
        if (filter.action) query.action = filter.action;
        if (filter.target) query.target = filter.target;
        if (filter.startDate) query.createdAt = { $gte: new Date(filter.startDate) };

        const logs = await AuditLog.find(query)
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit);

        const total = await AuditLog.countDocuments(query);

        return { logs, total, pages: Math.ceil(total / safeLimit) };
    }
}

const adminService = new AdminService();
export default adminService;