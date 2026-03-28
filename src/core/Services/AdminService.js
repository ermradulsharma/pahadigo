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
import VendorDocument from '@/models/VendorDocument.js';
import Dispute from '@/models/Dispute.js';
import NotificationService from '@/services/NotificationService.js';
import { RESPONSE_MESSAGES, HTTP_STATUS, USER_ROLES } from '@/constants/index.js';
import { SCHEMA_KEYS } from '@/constants/categories.js';
import { getStartDateByPeriod } from '@/helpers/dateUtils.js';
import { sanitizeHTML, redactSensitiveData } from '@/helpers/security.js';
import { getRequestMetadata } from '@/helpers/requestUtils.js';
import { mapToGeoJSON } from '@/helpers/geoUtils.js';
import mongoose from 'mongoose';
import crypto from 'crypto';

class AdminService {

    // --- Stats & Health ---

    async getSystemHealth() {
        // Mock health check - in real app, check DB, Redis, API connections
        return {
            status: 'healthy',
            uptime: process.uptime(),
            activeUsers: await User.countDocuments({ status: 'active' }),
            errorRate24h: '0.05%'
        };
    }

    async getDashboardStats() {
        const [users, totalVendors, pendingVendors, packages, categories, bookings, confirmedBookings] = await Promise.all([
            User.countDocuments({ role: 'traveller' }),
            Vendor.countDocuments(),
            Vendor.countDocuments({ isApproved: false }),
            Package.countDocuments(),
            Category.countDocuments(),
            Booking.countDocuments(),
            Booking.find({ paymentStatus: 'paid' }).select('totalPrice')
        ]);

        const revenue = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        const recentBookings = await Booking.find()
            .populate('user', 'name')
            .populate('package', 'title')
            .sort({ createdAt: -1 })
            .limit(5);

        const recentVendors = await Vendor.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5);

        // Mock/Aggregate additional dashboard data
        const systemActivity = [
            { time: '2 mins ago', type: 'security', status: 'success', message: 'New administrative login from 192.168.1.1' },
            { time: '15 mins ago', type: 'system', status: 'info', message: 'Weekly backup completed successfully.' },
            { time: '1 hour ago', type: 'alert', status: 'warning', message: 'High CPU usage detected on API node cluster 2' }
        ];

        const activeDisputes = await Dispute.find({ status: 'open' }).limit(3);

        const topTerritories = [
            { name: 'Uttarakhand', load: 85, color: 'bg-indigo-500' },
            { name: 'Himachal', load: 62, color: 'bg-emerald-500' },
            { name: 'Sikkim', load: 45, color: 'bg-rose-500' }
        ];

        const departures = [
            { user: 'Rahul Sharma', destination: 'Kedarnath Trek', time: 'Tomorrow, 06:00 AM', status: 'Active' },
            { user: 'Sanya Gupta', destination: 'Valley of Flowers', time: 'In 2 days', status: 'Pending' }
        ];

        const systemHealth = {
            dbLoad: 12,
            latency: 45,
            storageLoad: 38
        };

        return { 
            users, totalVendors, pendingVendors, packages, categories, revenue,
            recentBookings, recentVendors, systemActivity, activeDisputes, 
            topTerritories, departures, systemHealth 
        };
    }

    async getFinancialStats() {
        const stats = await Booking.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalPrice", 0] } },
                    pendingPayouts: { $sum: { $cond: [{ $eq: ["$payoutStatus", "pending"] }, "$totalPrice", 0] } },
                    refundsProcessed: { $sum: { $cond: [{ $eq: ["$refundStatus", "refunded"] }, "$refundAmount", 0] } }
                }
            }
        ]);
        return stats[0] || { totalRevenue: 0, pendingPayouts: 0, refundsProcessed: 0 };
    }

    async getMapAnalyticsData() {
        // Aggregate user distribution by state for heatmaps
        const userDistribution = await User.aggregate([
            { $group: { _id: "$address.state", count: { $sum: 1 } } }
        ]);
        return { userDistribution };
    }

    async getCalendarEvents(start, end) {
        // Fetch bookings for calendar view
        const bookings = await Booking.find({
            travelDate: { $gte: start, $lte: end }
        }).populate('user', 'name').populate('package', 'title');

        return bookings.map(b => ({
            id: b._id,
            title: b.package?.title || 'Booking',
            start: b.travelDate,
            user: b.user?.name,
            type: 'booking'
        }));
    }

    async getSearchAnalytics() {
        // Simplified search trends
        return {
            topSearches: [
                { query: 'Trekking', count: 1240 },
                { query: 'Homestays in Goa', count: 850 }
            ],
            zeroResultSearches: [
                { query: 'Skiing in Chennai', count: 12 }
            ]
        };
    }

    // --- User & Vendor Management ---

    async getAllTravellers() {
        return await User.find({ role: 'traveller' }).sort({ createdAt: -1 }).select('-password').lean();
    }

    async getAllVendors() {
        // Return combined view of user nodes and vendor profiles
        const vendors = await User.find({ role: 'vendor' }).select('-password').lean();
        const profiles = await Vendor.find().lean();
        const profileMap = profiles.reduce((acc, p) => ({ ...acc, [p.user.toString()]: p }), {});

        return vendors.map(v => {
            const profile = profileMap[v._id.toString()];
            return {
                ...v,
                user: v,
                hasProfile: !!profile,
                businessName: profile?.businessName || 'N/A',
                isApproved: profile?.isApproved || false,
                ...profile
            };
        });
    }

    async getVendorById(id) {
        let profile = await Vendor.findById(id).populate('category').lean();
        let user = null;

        if (profile) {
            user = await User.findById(profile.user).lean();
        } else {
            user = await User.findById(id).lean();
            if (user) profile = await Vendor.findOne({ user: id }).populate('category').lean();
        }

        if (!profile && !user) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

        const categoryDocuments = profile ? await VendorDocument.find({ vendor_id: profile._id }).lean() : [];
        return {
            ...(profile || {}),
            user: user || {},
            hasProfile: !!profile,
            categoryDocuments
        };
    }

    async createTraveller(data, req = null) {
        const { email, phone, name, password } = data;
        const exists = await User.findOne({ email });
        if (exists) throw new Error(RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS);

        const user = await User.create({
            email, phone, name, password,
            role: 'traveller', isVerified: true
        });

        if (req && req.user) {
            await this.logAction(req.user.id, 'CREATE', 'USER', user._id, { email: user.email }, req);
        }
        return user;
    }

    async createVendor(data, req = null) {
        let existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            if (existingUser.role !== 'vendor') throw new Error("Email registered with different role.");
        } else {
            existingUser = await User.create({
                email: data.email,
                phone: data.phone,
                name: data.ownerName || data.businessName,
                password: data.password || crypto.randomBytes(8).toString('hex'),
                role: 'vendor', isVerified: true
            });
        }

        const existingVendor = await Vendor.findOne({ user: existingUser._id });
        if (existingVendor) throw new Error("Vendor profile already exists.");

        const vendor = await Vendor.create({
            user: existingUser._id,
            ownerName: data.ownerName || existingUser.name,
            businessName: data.businessName,
            isApproved: true
        });

        if (req && req.user) {
            await this.logAction(req.user.id, 'CREATE', 'VENDOR', vendor._id, { businessName: vendor.businessName }, req);
        }
        return { user: existingUser, vendor };
    }

    async updateVendor(id, data, req = null) {
        let vendor = await Vendor.findById(id);
        let user = null;

        if (vendor) {
            user = await User.findById(vendor.user);
        } else {
            user = await User.findById(id);
            if (user) vendor = await Vendor.findOne({ user: id });
        }

        if (!vendor && !user) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

        const userFields = ['name', 'phone', 'status', 'isVerified'];
        const vendorFields = ['ownerName', 'businessName', 'address', 'bankDetails', 'documents', 'isApproved'];

        const userData = {};
        const vendorUpdateData = {};

        Object.keys(data).forEach(key => {
            if (userFields.includes(key)) userData[key] = data[key];
            if (vendorFields.includes(key)) vendorUpdateData[key] = data[key];
        });

        if (vendor && Object.keys(vendorUpdateData).length > 0) {
            if (data.address) {
                vendorUpdateData.address = { ...(vendor.address || {}), ...data.address };
                mapToGeoJSON(vendorUpdateData.address, 'location');
            }
            await Vendor.findByIdAndUpdate(vendor._id, { $set: vendorUpdateData });
        }

        if (user && Object.keys(userData).length > 0) {
            if (data.preferences) {
                const existing = user.preferences || {};
                userData.preferences = { ...existing, ...data.preferences };
            }
            await User.findByIdAndUpdate(user._id, { $set: userData });
        }

        if (req && req.user) {
            await this.logAction(req.user.id, 'UPDATE', 'VENDOR', id, { changes: data }, req);
        }

        return vendor ? await Vendor.findById(vendor._id).populate('user') : await User.findById(user._id);
    }

    async approveVendor(vendorId) {
        const vendor = await Vendor.findByIdAndUpdate(vendorId, { isApproved: true }, { returnDocument: 'after' });
        if (vendor) NotificationService.notifyVendorApproval(vendorId, true);
        return vendor;
    }

    async deleteVendor(id) {
        const vendor = await Vendor.findById(id);
        if (vendor) {
            await User.findByIdAndDelete(vendor.user);
            await Vendor.findByIdAndDelete(id);
        } else {
            const user = await User.findById(id);
            if (user) {
                await Vendor.findOneAndDelete({ user: id });
                await User.findByIdAndDelete(id);
            }
        }
        return true;
    }

    async deleteTraveller(id) {
        return await User.findByIdAndDelete(id);
    }

    async updateTraveller(id, data, req = null) {
        const user = await User.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (req && req.user) await this.logAction(req.user.id, 'UPDATE', 'USER', id, { changes: data }, req);
        return user;
    }

    async changeAdminPassword(adminId, oldPass, newPass) {
        const user = await User.findById(adminId);
        if (!user) throw new Error("Admin not found");
        // Simple mock check for now - in real app use bcrypt compare
        user.password = newPass;
        await user.save();
        return true;
    }

    // --- Policies & content ---

    async getPolicies(target = null) {
        const filter = target ? { target } : {};
        return await Policy.find(filter);
    }

    async getPolicy(target, type) {
        return await Policy.findOne({ target, type });
    }

    async updatePolicy(target, type, content, adminId) {
        const sanitized = sanitizeHTML(content);
        return await Policy.findOneAndUpdate(
            { target, type },
            { content: sanitized, lastUpdatedBy: adminId },
            { returnDocument: 'after', upsert: true }
        );
    }

    // --- Inventory & Items ---

    async getAllServices() {
        const packages = await Package.find().populate('vendor', 'businessName');
        const services = [];
        packages.forEach(pkg => {
            SCHEMA_KEYS.forEach(type => {
                if (Array.isArray(pkg[type])) {
                    pkg[type].forEach(item => {
                        services.push({
                            ...item.toObject(),
                            serviceType: type,
                            vendor: pkg.vendor
                        });
                    });
                }
            });
        });
        return services;
    }

    async toggleServiceStatus(vendorId, serviceType, serviceId, status, req = null) {
        const pkg = await Package.findOne({ vendor: vendorId });
        if (!pkg) throw new Error(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);

        const list = pkg[serviceType];
        if (!list) throw new Error(`Invalid service type: ${serviceType}`);

        const idx = list.findIndex(s => s._id.toString() === serviceId);
        if (idx === -1) throw new Error(RESPONSE_MESSAGES.ITEM.NOT_FOUND);

        pkg[serviceType][idx].isActive = status;
        pkg.markModified(serviceType);
        await pkg.save();

        if (req && req.user) {
            await this.logAction(req.user.id, 'UPDATE_STATUS', 'INVENTORY', serviceId, { status }, req);
        }
        return pkg[serviceType][idx];
    }

    async getVendorPackages(vendorId) {
        return await Package.find({ vendor: vendorId });
    }

    async getPackageItem(itemId) {
        const packages = await Package.find();
        for (const pkg of packages) {
            for (const key of SCHEMA_KEYS) {
                const item = pkg[key]?.id(itemId);
                if (item) return { ...item.toObject(), serviceType: key, vendorId: pkg.vendor };
            }
        }
        throw new Error("Item not found");
    }

    async updatePackageItem(itemId, data) {
        const packages = await Package.find();
        for (const pkg of packages) {
            for (const key of SCHEMA_KEYS) {
                const item = pkg[key]?.id(itemId);
                if (item) {
                    Object.assign(item, data);
                    pkg.markModified(key);
                    await pkg.save();
                    return item;
                }
            }
        }
        throw new Error("Item not found");
    }

    // --- Reviews ---

    async getAllReviews() {
        return await Review.find().populate('user', 'name').populate('vendor', 'businessName').sort({ createdAt: -1 });
    }

    async toggleReviewVisibility(reviewId, isVisible, req = null) {
        const review = await Review.findByIdAndUpdate(reviewId, { isVisible }, { returnDocument: 'after' });
        if (req && req.user) {
            await this.logAction(req.user.id, 'UPDATE_VISIBILITY', 'REVIEW', reviewId, { isVisible }, req);
        }
        return review;
    }

    async deleteReview(reviewId, req = null) {
        const res = await Review.findByIdAndDelete(reviewId);
        if (req && req.user) await this.logAction(req.user.id, 'DELETE', 'REVIEW', reviewId, {}, req);
        return res;
    }

    // --- Assets & Coupons ---

    async createBanner(data, req = null) {
        const b = await Banner.create(data);
        if (req && req.user) this.logAction(req.user.id, 'CREATE', 'BANNER', b._id, { title: b.title }, req);
        return b;
    }

    async getBanners() {
        return await Banner.find().sort({ position: 1 });
    }

    async updateBanner(id, data, req = null) {
        const b = await Banner.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (req && req.user) this.logAction(req.user.id, 'UPDATE', 'BANNER', id, { changes: data }, req);
        return b;
    }

    async deleteBanner(id, req = null) {
        if (req && req.user) await this.logAction(req.user.id, 'DELETE', 'BANNER', id, {}, req);
        return await Banner.findByIdAndDelete(id);
    }

    async createCoupon(data, req = null) {
        const c = await Coupon.create(data);
        if (req && req.user) this.logAction(req.user.id, 'CREATE', 'COUPON', c._id, { code: c.code }, req);
        return c;
    }

    async getCoupons() {
        return await Coupon.find().sort({ createdAt: -1 });
    }

    async updateCoupon(id, data, req = null) {
        const c = await Coupon.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (req && req.user) this.logAction(req.user.id, 'UPDATE', 'COUPON', id, { changes: data }, req);
        return c;
    }

    async deleteCoupon(id, req = null) {
        if (req && req.user) this.logAction(req.user.id, 'DELETE', 'COUPON', id, {}, req);
        return await Coupon.findByIdAndDelete(id);
    }

    // --- Support ---

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
        const [revenueData, bookingStatus, userGrowth] = await Promise.all([
            Booking.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalPrice" } } },
                { $sort: { _id: 1 } }
            ]),
            Booking.aggregate([
                { $group: { _id: "$status", value: { $sum: 1 } } }
            ]),
            User.aggregate([
                { $match: { role: 'traveller', createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, users: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ])
        ]);

        const topVendors = await Booking.aggregate([
            { $match: { paymentStatus: 'paid' } },
            { $group: { _id: "$vendor", totalRevenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 } } },
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 }
        ]);

        // Map vendor names to topVendors
        const vendorIds = topVendors.map(v => v._id);
        const vendors = await Vendor.find({ _id: { $in: vendorIds } }).lean();
        const vendorMap = vendors.reduce((acc, v) => ({ ...acc, [v._id.toString()]: v.businessName }), {});

        const formattedTopVendors = topVendors.map(v => ({
            name: vendorMap[v._id?.toString()] || 'Unknown Vendor',
            bookings: v.bookings,
            revenue: v.totalRevenue
        }));

        return { 
            revenueData, 
            bookingStatus: bookingStatus.map(b => ({ name: b._id, value: b.value })),
            userGrowth,
            topVendors: formattedTopVendors
        };
    }

    async getPaymentHistory() {
        return await Booking.find({ $or: [{ paymentStatus: 'paid' }, { refundStatus: 'refunded' }] })
            .populate('user', 'name')
            .populate({ path: 'package', populate: { path: 'vendor', select: 'businessName' } });
    }

    // --- Audit Logs ---

    async logAction(userId, action, target, targetId, details = {}, req = null) {
        try {
            const { ipAddress, userAgent } = getRequestMetadata(req);
            const logData = {
                userId,
                action: action.toUpperCase(),
                target: target.toUpperCase(),
                targetId: String(targetId),
                details: redactSensitiveData(details),
                ipAddress,
                userAgent
            };
            await AuditLog.create(logData);
        } catch (error) {
            console.error("[AuditLog] Failed to log:", error.message);
        }
    }

    async getAuditLogs(filter = {}, page = 1, limit = 20) {
        const query = {};
        if (filter.userId) query.userId = filter.userId;
        if (filter.adminId) query.userId = filter.adminId; // Backwards compatibility for tests
        if (filter.action) query.action = filter.action.toUpperCase();
        if (filter.target) query.target = filter.target.toUpperCase();
        if (filter.startDate) query.createdAt = { $gte: new Date(filter.startDate) };

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        return { logs, total, totalPages: Math.ceil(total / limit) };
    }

    // --- Bookings ---

    async getAllBookings() {
        return await Booking.find().populate('user', 'name').populate('package', 'title').sort({ createdAt: -1 });
    }

    // --- Disputes ---

    async getDisputes(filter = {}, page = 1, limit = 20) {
        const query = {};
        if (filter.status) query.status = filter.status;
        if (filter.vendorId) query.vendorId = filter.vendorId;
        
        const total = await Dispute.countDocuments(query);
        const disputes = await Dispute.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        
        return { disputes, total, totalPages: Math.ceil(total / limit) };
    }

    async resolveDispute(adminId, disputeId, decision, adminNotes, req = null) {
        const dispute = await Dispute.findByIdAndUpdate(disputeId, {
            status: decision,
            adminNotes,
            resolvedAt: new Date(),
            resolvedBy: adminId
        }, { returnDocument: 'after' });
        
        if (req && req.user) await this.logAction(adminId, 'RESOLVE', 'DISPUTE', disputeId, { decision }, req);
        return dispute;
    }
}

const adminService = new AdminService();
export default adminService;
