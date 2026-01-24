import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Booking from '../models/Booking.js';

class AdminService {
    async getDashboardStats() {
        const [userCount, vendorCount, bookingCount, revenue] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Vendor.countDocuments(),
            Booking.countDocuments(),
            Booking.aggregate([
                { $match: { paymentStatus: 'paid', refundStatus: 'none' } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ])
        ]);

        return {
            users: userCount,
            vendors: vendorCount,
            bookings: bookingCount,
            revenue: revenue[0] ? revenue[0].total : 0
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
        return await Vendor.find().populate('user', 'email phone');
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
}

export default new AdminService();
