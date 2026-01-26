import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Booking from '../models/Booking.js';
import Package from '../models/Package.js';
import Category from '../models/Category.js';
import Policy from '../models/Policy.js';

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
}

const adminService = new AdminService();
export default adminService;
