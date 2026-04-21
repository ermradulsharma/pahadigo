import User from '@/models/User.js';
import Vendor from '@/models/Vendor.js';
import Booking from '@/models/Booking.js';
import Package from '@/models/Package.js';
import Category from '@/models/Category.js';
import Dispute from '@/models/Dispute.js';
import SearchLog from '@/models/SearchLog.js';
import { getStartDateByPeriod } from '@/helpers/dateUtils.js';
import { STATUS, USER_ROLES } from '@/constants/index.js';

/**
 * DashboardService (Admin Role)
 * Centralized logic for system stats, health, and trend analytics.
 */
class DashboardService {
    async getSystemHealth() {
        return {
            status: 'healthy',
            uptime: process.uptime(),
            activeUsers: await User.countDocuments({ status: STATUS.ACTIVE })
        };
    }

    async getDashboardStats() {
        const [users, totalVendors, pendingVendors, categories, bookings, confirmedBookings, packageStats] = await Promise.all([
            User.countDocuments({ role: USER_ROLES.TRAVELLER }),
            Vendor.countDocuments(),
            Vendor.countDocuments({ isApproved: false }),
            Category.countDocuments(),
            Booking.countDocuments(),
            Booking.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Package.aggregate([
                {
                    $project: {
                        items: {
                            $concatArrays: [
                                { $ifNull: ["$homestay", []] },
                                { $ifNull: ["$trekking", []] },
                                { $ifNull: ["$hotel", []] },
                                { $ifNull: ["$camping", []] },
                                { $ifNull: ["$paragliding", []] },
                                { $ifNull: ["$rafting", []] },
                                { $ifNull: ["$skating", []] },
                                { $ifNull: ["$vehicleRental", []] }
                            ]
                        }
                    }
                },
                { $unwind: "$items" },
                { $match: { "items.isActive": true } },
                { $count: "count" }
            ])
        ]);

        const revenue = confirmedBookings[0]?.total || 0;
        const activeItemsCount = packageStats[0]?.count || 0;

        return {
            users,
            totalVendors,
            pendingVendors,
            packages: activeItemsCount,
            categories,
            revenue,
            recentBookings: await Booking.find().populate('user', 'name').populate('package', 'title').sort({ createdAt: -1 }).limit(5),
            recentVendors: await Vendor.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
            activeDisputes: await Dispute.find({ status: 'open' }).limit(3)
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

    async getAnalyticsData(period = 'monthly') {
        const startDate = getStartDateByPeriod(period);
        const [revenueData, bookingStatus, userGrowth, topVendors] = await Promise.all([
            Booking.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalPrice" } } },
                { $sort: { _id: 1 } }
            ]),
            Booking.aggregate([
                { $group: { _id: "$status", value: { $sum: 1 } } }
            ]),
            User.aggregate([
                { $match: { createdAt: { $gte: startDate }, role: { $in: ['traveller', 'vendor'] } } },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            role: "$role"
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: "$_id.date",
                        travellers: { $sum: { $cond: [{ $eq: ["$_id.role", "traveller"] }, "$count", 0] } },
                        vendors: { $sum: { $cond: [{ $eq: ["$_id.role", "vendor"] }, "$count", 0] } }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            Booking.aggregate([
                { $match: { paymentStatus: 'paid' } },
                { $group: { _id: "$vendor", totalRevenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 } } },
                { $sort: { totalRevenue: -1 } },
                { $limit: 5 }
            ])
        ]);

        // Resolve vendor names
        const vendorIds = topVendors.map(v => v._id);
        const vendors = await Vendor.find({ _id: { $in: vendorIds } }).lean();
        const vendorMap = vendors.reduce((acc, v) => { acc[v._id.toString()] = v.businessName; return acc; }, {});

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

    async getMapAnalyticsData() {
        const userDistribution = await User.aggregate([
            { $group: { _id: "$address.state", count: { $sum: 1 } } }
        ]);
        return { userDistribution };
    }

    async getCalendarEvents(start, end) {
        const bookings = await Booking.find({
            startDate: { $gte: start },
            endDate: { $lte: end }
        }).populate('user', 'name').populate('vendor', 'businessName');

        return bookings.map(b => ({
            id: b._id,
            title: b.bookingDetails?.category || 'Booking',
            start: b.startDate,
            end: b.endDate,
            user: b.user?.name,
            type: 'booking'
        }));
    }

    async getSearchAnalytics() {
        const topSearches = await SearchLog.find()
            .sort({ count: -1 })
            .limit(10)
            .select('query count lastSearched resultsCount');

        const zeroResultSearches = await SearchLog.find({ resultsCount: 0 })
            .sort({ count: -1 })
            .limit(5)
            .select('query count lastSearched');

        return { topSearches, zeroResultSearches };
    }
}

export default new DashboardService();
