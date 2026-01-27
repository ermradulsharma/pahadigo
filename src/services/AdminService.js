import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Booking from '../models/Booking.js';
import Package from '../models/Package.js';
import Category from '../models/Category.js';
import Policy from '../models/Policy.js';
import Review from '../models/Review.js';
import Banner from '../models/Banner.js';
import Coupon from '../models/Coupon.js';
import Inquiry from '../models/Inquiry.js';
import AuditLog from '../models/AuditLog.js';

class AdminService {
    async getDashboardStats() {
        const [userCount, vendorCount, verifiedVendorCount, pendingVendorCount, bookingCount, packageCount, categoryCount, revenue, recentBookings, recentVendors] = await Promise.all([
            User.countDocuments({ role: 'traveller' }),
            User.countDocuments({ role: 'vendor' }),
            Vendor.countDocuments({ isApproved: true }),
            Vendor.countDocuments({ isApproved: false }),
            Booking.countDocuments(),
            Package.countDocuments(),
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
        const users = await User.find({ role: 'vendor' }).select('name email phone createdAt');
        const profiles = await Vendor.find().lean();

        return users.map(u => {
            const profile = profiles.find(p => p.user?.toString() === u._id.toString());
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
        if (existing) throw new Error('User with this email already exists');

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
        return await Vendor.findByIdAndUpdate(vendorId, { isApproved: true }, { new: true });
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
        return await Policy.findOneAndUpdate(
            { target, type },
            {
                content,
                lastUpdatedBy: adminId
            },
            {
                new: true,
                upsert: true
            }
        );
    }

    async getAllServices() {
        const packages = await Package.find()
            .populate({
                path: 'vendor',
                select: 'businessName'
            });

        const allServices = [];
        packages.forEach(pkg => {
            if (pkg.services) {
                Object.keys(pkg.services).forEach(type => {
                    if (Array.isArray(pkg.services[type])) {
                        pkg.services[type].forEach(service => {
                            allServices.push({
                                ...service.toObject(),
                                serviceType: type,
                                vendor: pkg.vendor,
                                vendorId: pkg.vendor?._id
                            });
                        });
                    }
                });
            }
        });

        return allServices;
    }

    async toggleServiceStatus(vendorId, serviceType, serviceId, status) {
        const pkg = await Package.findOne({ vendor: vendorId });
        if (!pkg) throw new Error('Package collection not found for this vendor');

        const services = pkg.services[serviceType];
        if (!services) throw new Error(`Service type ${serviceType} not found`);

        const serviceIndex = services.findIndex(s => s._id.toString() === serviceId);
        if (serviceIndex === -1) throw new Error('Service not found');

        pkg.services[serviceType][serviceIndex].isActive = status;
        pkg.markModified(`services.${serviceType}`);
        await pkg.save();

        // Audit Log
        const adminId = req?.user?.id || req?.user?._id;
        if (adminId) this.logAction(adminId, 'UPDATE_STATUS', 'INVENTORY', serviceId, { status: status }, req);

        return pkg.services[serviceType][serviceIndex];
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
            { new: true }
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
        const banner = await Banner.findByIdAndUpdate(id, data, { new: true });
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
        const coupon = await Coupon.findByIdAndUpdate(id, data, { new: true });
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
        return await Inquiry.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteInquiry(id) {
        return await Inquiry.findByIdAndDelete(id);
    }

    // --- Analytics ---

    async getAnalyticsData(period = 'monthly') {
        const now = new Date();
        let startDate;

        if (period === 'yearly') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else if (period === 'weekly') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
        } else {
            // Default: Monthly (Last 30 days)
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
        }

        // 1. Revenue & Bookings Trend
        const revenueData = await Booking.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$amount" },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 2. Booking Status Distribution
        const bookingStatus = await Booking.aggregate([
            { $group: { _id: "$status", value: { $sum: 1 } } }
        ]);

        // 3. User Growth
        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: startDate }, role: { $in: ['traveller', 'vendor'] } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    users: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 4. Top Vendors by Revenue
        const topVendors = await Booking.aggregate([
            { $match: { status: 'completed' } }, // Only confirmed revenue
            {
                $group: {
                    _id: "$vendor",
                    revenue: { $sum: "$amount" },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "vendors",
                    localField: "_id",
                    foreignField: "_id",
                    as: "vendorDetails"
                }
            },
            { $unwind: "$vendorDetails" },
            {
                $project: {
                    name: "$vendorDetails.businessName",
                    revenue: 1,
                    bookings: 1
                }
            }
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
    async logAction(adminId, action, target, targetId, details, req = null) {
        try {
            let ipAddress = null;
            let userAgent = null;

            if (req) {
                // Next.js: standard headers or socket
                ipAddress = req.headers.get('x-forwarded-for') || req.socket?.remoteAddress;
                userAgent = req.headers.get('user-agent');
            }

            await AuditLog.create({
                adminId,
                action,
                target,
                targetId,
                details,
                ipAddress,
                userAgent
            });
        } catch (error) {
            console.error("Failed to write audit log:", error);
            // Non-blocking: Don't throw, just log the error.
        }
    }

    async getAuditLogs(filter = {}, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const query = {};

        if (filter.adminId) query.adminId = filter.adminId;
        if (filter.action) query.action = filter.action;
        if (filter.target) query.target = filter.target;
        if (filter.startDate) query.createdAt = { $gte: new Date(filter.startDate) };

        const logs = await AuditLog.find(query)
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AuditLog.countDocuments(query);

        return { logs, total, pages: Math.ceil(total / limit) };
    }
}

const adminService = new AdminService();
export default adminService;
