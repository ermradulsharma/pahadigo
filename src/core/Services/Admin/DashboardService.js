import mongoose from 'mongoose';
import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import Booking from '@/core/Models/Booking.js';
import Package from '@/core/Models/Package.js';
import Category from '@/core/Models/Category.js';
import Dispute from '@/core/Models/Dispute.js';
import SearchLog from '@/core/Models/SearchLog.js';
import AuditLog from '@/core/Models/AuditLog.js';
import os from 'os';
import { getStartDateByPeriod } from '@/core/Helpers/dateUtils.js';
import { STATUS, USER_ROLES } from '@/core/Constants/index.js';

/**
 * DashboardService (Admin Role)
 * Centralized logic for system stats, health, and trend analytics.
 */
class DashboardService {
  async getSystemHealth() {
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const usedMem = totalMem - freeMem;
    const loadAvg = os.loadavg();
    
    // Database stats
    let dbStats = { dataSize: 0, storageSize: 0, collections: 0 };
    try {
      dbStats = await mongoose.connection.db.stats();
    } catch (e) {
      console.error("DB Stats fetch error:", e);
    }

    return {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: Date.now(),
      activeUsers: await User.countDocuments({ status: STATUS.ACTIVE }),
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        percentage: Math.round((usedMem / totalMem) * 100)
      },
      cpu: {
        load: loadAvg,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model
      },
      database: {
        collections: dbStats.collections || 0,
        dataSize: dbStats.dataSize || 0,
        storageSize: dbStats.storageSize || 0,
        objects: dbStats.objects || 0
      }
    };
  }

  async getDashboardStats() {
    const startTime = Date.now();
    const [users, totalVendors, pendingVendors, categories, bookings, confirmedBookings, packageStats, dbStats] = await Promise.all([
      User.countDocuments({ role: USER_ROLES.TRAVELLER }),
      Vendor.countDocuments(),
      Vendor.countDocuments({ isApproved: false }),
      Category.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { paymentStatus: { $regex: /^paid$/i } } },
        { $group: { _id: null, total: { $sum: { $convert: { input: "$pricing.total", to: "double", onError: 0, onNull: 0 } } } } }
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
      ]),
      mongoose.connection.db.stats()
    ]);

    const revenue = confirmedBookings[0]?.total || 0;
    const activeItemsCount = packageStats[0]?.count || 0;

    // Top Territories (Aggregation by vendor's city)
    const territories = await Vendor.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: "$address.city" } },
      {
        $lookup: {
          from: 'bookings',
          let: { city: "$_id" },
          pipeline: [
            {
              $lookup: {
                from: 'vendors',
                localField: 'vendor',
                foreignField: '_id',
                as: 'v'
              }
            },
            { $unwind: '$v' },
            { 
              $match: { 
                $expr: { $eq: ["$v.address.city", "$$city"] },
                paymentStatus: { $regex: /^paid$/i } 
              } 
            }
          ],
          as: 'cityBookings'
        }
      },
      { 
        $project: { 
          _id: 1, 
          count: { $size: "$cityBookings" } 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    const totalBookingsCount = await Booking.countDocuments();
    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500'];
    const topTerritories = territories.map((t, i) => ({
      name: t._id || 'Remote',
      load: Math.min(Math.round((t.count / (totalBookingsCount || 1)) * 100), 100),
      color: colors[i % colors.length]
    }));

    // Upcoming Departures (Next 7 days)
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const departuresRaw = await Booking.find({
      startDate: { $gte: today, $lte: nextWeek },
      status: 'confirmed'
    }).populate('user', 'name').sort({ startDate: 1 }).limit(5);

    const departures = departuresRaw.map(d => ({
      user: d.user?.name || 'Traveller',
      destination: d.item?.title || 'Mission',
      time: new Date(d.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      status: 'Active'
    }));

    // Recent System Activity (Audit Logs)
    const recentLogs = await AuditLog.find()
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    const systemActivity = recentLogs.map(log => ({
      time: new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      type: log.target.toLowerCase(),
      message: `${log.userId?.name || 'System'} performed ${log.action.toLowerCase()} on ${log.target.toLowerCase()}`,
      status: log.action === 'DELETE' ? 'error' : log.action === 'UPDATE' ? 'warning' : 'success'
    }));

    const latency = Date.now() - startTime;

    return {
      users,
      totalVendors,
      pendingVendors,
      packages: activeItemsCount,
      categories,
      revenue,
      recentBookings: await Booking.find().populate('user', 'name').populate('package', 'title').sort({ createdAt: -1 }).limit(50),
      recentVendors: await Vendor.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(5),
      activeDisputes: (await Dispute.find({ status: 'open' }).populate('bookingId', 'bookingCode traveller').populate('traveller', 'name').limit(3).lean()).map(d => ({
        id: d.bookingId?.bookingCode || `DSP-${d._id.toString().slice(-4).toUpperCase()}`,
        priority: d.reason === 'safety_concern' ? 'Critical' : 'High',
        issue: d.reason?.replace(/_/g, ' ').toUpperCase() || 'Service Disruption',
        user: d.bookingId?.traveller?.name || d.traveller?.name || 'Anonymous'
      })),
      topTerritories,
      departures,
      systemActivity,
      systemHealth: {
        dbLoad: Math.round((process.memoryUsage().rss / (os.totalmem() / 10)) * 100), // Server RAM load relative to 10% system cap
        latency: latency,
        storageLoad: Math.min(Math.round((dbStats.dataSize / (dbStats.storageSize || 1)) * 100), 100) // DB Fragmentation/Storage efficiency
      }
    };
  }

  async getFinancialStats() {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, { $ifNull: ["$pricing.total", 0] }, 0] } },
          pendingPayouts: { $sum: { $cond: [{ $eq: ["$payout.status", "pending"] }, { $ifNull: ["$pricing.total", 0] }, 0] } },
          refundsProcessed: { $sum: { $cond: [{ $eq: ["$pricing.refundStatus", "refunded"] }, { $ifNull: ["$pricing.refundAmount", 0] }, 0] } }
        }
      }
    ]);
    return stats[0] || { totalRevenue: 0, pendingPayouts: 0, refundsProcessed: 0 };
  }

  async getAnalyticsData(period = 'monthly') {
    const startDate = getStartDateByPeriod(period);
    const [revenueDataRaw, bookingStatus, userGrowthRaw, topVendors] = await Promise.all([
      Booking.aggregate([
        { $match: { createdAt: { $gte: startDate }, paymentStatus: { $regex: /^paid$/i } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" } } }, revenue: { $sum: { $convert: { input: "$pricing.total", to: "double", onError: 0, onNull: 0 } } } } },
        { $project: { date: "$_id", revenue: 1, _id: 0 } },
        { $sort: { date: 1 } }
      ]),
      Booking.aggregate([
        { $group: { _id: "$status", value: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startDate }, role: { $in: ['traveller', 'vendor'] } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$createdAt" } } },
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
        { $match: { paymentStatus: { $regex: /^paid$/i } } },
        { $group: { _id: "$vendor", totalRevenue: { $sum: { $convert: { input: "$pricing.total", to: "double", onError: 0, onNull: 0 } } }, bookings: { $sum: 1 } } },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 }
      ])
    ]);

    // Gap filling for Revenue Data
    const revenueMap = new Map(revenueDataRaw.map(d => [d.date, d.revenue]));
    const userGrowthMap = new Map(userGrowthRaw.map(u => [u._id, { travellers: u.travellers, vendors: u.vendors }]));

    const revenueData = [];
    const userGrowth = [];
    const dateIter = new Date(startDate);
    const today = new Date();

    while (dateIter <= today) {
      const dateStr = dateIter.toISOString().split('T')[0];

      revenueData.push({
        _id: dateStr,
        revenue: revenueMap.get(dateStr) || 0
      });

      const growth = userGrowthMap.get(dateStr) || { travellers: 0, vendors: 0 };
      userGrowth.push({
        _id: dateStr,
        ...growth
      });

      dateIter.setDate(dateIter.getDate() + 1);
    }

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
      bookingStatus: bookingStatus.map(b => ({ name: b._id?.toUpperCase() || 'UNKNOWN', value: b.value })),
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
