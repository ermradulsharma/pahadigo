import mongoose from 'mongoose';
import crypto from 'crypto';
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
import VendorDocument from '@/models/VendorDocument.js';
import Dispute from '@/models/Dispute.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';
import { SCHEMA_KEYS } from '@/constants/categories.js';
import { mapToGeoJSON } from '@/helpers/geoUtils.js';
import NotificationService from '@/services/NotificationService.js';

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
        const now = new Date();
        const next48 = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const [
            userCount, vendorCount, verifiedVendorCount, pendingVendorCount, bookingCount,
            categoryCount, revenue, recentBookings, recentVendors,
            systemLogs, activeDisputes, topTerritoriesData, departuresData
        ] = await Promise.all([
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
            Booking.find().sort({ bookingDate: -1 }).limit(5).populate('user', 'name').populate({ path: 'package', select: 'title' }),
            Vendor.find().sort({ createdAt: -1 }).limit(5).populate('user', 'email'),

            // New real-data queries for the cyber dashboard
            AuditLog.find().sort({ createdAt: -1 }).limit(7).lean(),
            Dispute.find({ status: { $in: ['open', 'pending', 'reviewing'] } }).populate('user', 'name').sort({ createdAt: -1 }).limit(3).lean(),
            Booking.aggregate([
                { $match: { "package": { $exists: true } } },
                // Need to lookup package to get destination or we group by booking vendor's stat... Let's simpler: count users by states for now
            ]),
            Booking.find({ travelDate: { $gte: now, $lte: next48 }, status: 'confirmed' }).populate('user', 'name').populate('package', 'title').sort({ travelDate: 1 }).limit(5).lean()
        ]);

        // Better Top Territories aggregation (Using user states)
        const topTerritoriesAgg = await User.aggregate([
            { $match: { role: 'traveller', "address.state": { $exists: true, $ne: "" }, "address.state": { $ne: null } } },
            { $group: { _id: "$address.state", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Process System Activity
        const systemActivity = systemLogs.map(log => ({
            time: new Date(log.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            type: log.action === 'ERROR' ? 'SEC' : log.action === 'CREATE' ? 'SYS' : 'DB',
            message: log.details?.message || `Ref: ${log.resourceType} - ${log.action}`,
            status: log.action === 'ERROR' ? 'error' : log.action === 'CREATE' ? 'success' : 'info'
        }));

        // Process Active Disputes
        const processedDisputes = activeDisputes.map(d => ({
            id: `#DSP-${d._id.toString().substring(18, 24).toUpperCase()}`,
            user: d.user?.name || 'Unknown User',
            issue: d.reason || d.description || 'Action intervention required',
            priority: d.priority || 'Medium',
            status: d.status
        }));

        // Process Territories
        const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-pink-500', 'bg-orange-500'];
        const totalUsers = userCount || 1; // avoid divide by zero
        const topTerritories = topTerritoriesAgg.map((t, idx) => ({
            name: t._id,
            load: Math.round((t.count / totalUsers) * 100) || 5, // at least 5% bar show
            color: colors[idx % colors.length]
        }));

        // Process departures
        const processedDepartures = departuresData.map(dep => {
            const hoursDiff = Math.abs(new Date(dep.travelDate) - now) / 36e5;
            return {
                user: dep.user?.name || 'Anonymous',
                destination: dep.package?.title || 'Unknown Destination',
                time: hoursDiff < 1 ? 'Deploying' : `T-Minus ${Math.floor(hoursDiff)}h`,
                status: hoursDiff < 2 ? 'Active' : 'Standby'
            };
        });

        const os = await import('os');
        const systemHealth = {
            dbLoad: Math.round(Math.random() * 20 + 20), // Placeholder db load
            latency: Math.round(Math.random() * 50 + 10), // Placeholder ms
            storageLoad: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100) || 45
        };

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
            recentVendors,
            systemActivity: systemActivity.length > 0 ? systemActivity : [
                { time: now.toLocaleTimeString(), type: 'SYS', message: 'Mainframe initialized.', status: 'info' }
            ],
            activeDisputes: processedDisputes,
            topTerritories: topTerritories.length > 0 ? topTerritories : [
                { name: 'Global Network', load: 100, color: 'bg-indigo-500' }
            ],
            departures: processedDepartures,
            systemHealth
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

        // 1. Fetch vendor category documents
        const vendorDocs = await VendorDocument.find().lean();

        // 2. Map documents by vendor _id
        const vendorDocsMap = new Map();
        vendorDocs.forEach(doc => {
            if (!doc.vendor_id) return;
            const vendorIdStr = doc.vendor_id.toString();
            if (!vendorDocsMap.has(vendorIdStr)) {
                vendorDocsMap.set(vendorIdStr, []);
            }
            vendorDocsMap.get(vendorIdStr).push(doc);
        });

        const profileMap = new Map(profiles.map(p => [p.user ? p.user.toString() : 'missing', p]));
        return users.map(u => {
            const profile = profileMap.get(u._id ? u._id.toString() : '');
            let categoryDocuments = [];

            if (profile) {
                categoryDocuments = vendorDocsMap.get(profile._id.toString()) || [];
                return { ...profile, user: u, hasProfile: true, categoryDocuments };
            }

            return {
                _id: u._id,
                user: u,
                businessName: 'Profile Pending',
                isApproved: false,
                category: [],
                hasProfile: false,
                categoryDocuments: [],
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

    async updateTraveller(id, data, req = null) {
        const user = await User.findById(id);
        if (!user || user.role !== 'traveller') {
            throw new Error("Traveller not found");
        }

        const allowedUpdates = ['name', 'phone', 'status', 'email'];
        allowedUpdates.forEach(field => {
            if (data[field] !== undefined) {
                user[field] = data[field];
            }
        });

        if (data.password) {
            user.password = data.password;
        }

        await user.save();

        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'UPDATE', 'USER', user._id, { fields_changed: Object.keys(data) }, req);
        }
        return user;
    }

    async createVendor(data, req = null) {
        let existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            if (existingUser.role !== 'vendor') throw new Error("Email already registered with a different role.");
        } else {
            // Generate a secure random generic password since admin is creating without one, or use provided
            const password = data.password || crypto.randomBytes(8).toString('hex') + "A1!";
            existingUser = await User.create({
                email: data.email,
                phone: data.phone,
                name: data.ownerName || data.businessName,
                password: password,
                role: 'vendor',
                isVerified: true,
                status: 'active'
            });
        }

        const existingVendor = await Vendor.findOne({ user: existingUser._id });
        if (existingVendor) throw new Error("Vendor profile already exists for this user.");

        const vendor = await Vendor.create({
            user: existingUser._id,
            ownerName: data.ownerName || existingUser.name,
            businessName: data.businessName,
            businessNumber: data.phone || data.businessNumber,
            isApproved: true // Admin created vendors get auto-approved
        });

        if (req && req.user) {
            const adminId = req.user.id || req.user._id;
            this.logAction(adminId, 'CREATE', 'VENDOR', vendor._id, { businessName: vendor.businessName }, req);
        }
        return { user: existingUser, vendor };
    }

    async changeAdminPassword(adminId, oldPassword, newPassword) {
        const admin = await User.findById(adminId).select('+password');
        if (!admin) throw new Error(RESPONSE_MESSAGES.ERROR.UNAUTHORIZED);

        const isMatch = await admin.comparePassword(oldPassword);
        if (!isMatch) throw new Error("Incorrect current password");

        admin.password = newPassword;
        await admin.save();

        this.logAction(adminId, 'UPDATE', 'USER', adminId, { field: 'password' });
        return true;
    }

    async approveVendor(vendorId) {
        const vendor = await Vendor.findByIdAndUpdate(vendorId, { isApproved: true }, { returnDocument: 'after' });
        if (vendor) {
            NotificationService.notifyVendorApproval(vendor._id || vendorId, true);
        }
        return vendor;
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
        return await Booking.find({
            $or: [{ paymentStatus: 'paid' }, { refundStatus: 'refunded' }]
        })
            .populate('user', 'name email')
            .populate({ path: 'package', select: 'title vendor', populate: { path: 'vendor', select: 'businessName phone email' } })
            .sort({ bookingDate: -1 });
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

    async getPackageItem(itemId) {
        let pkg = await Package.findOne({
            $or: SCHEMA_KEYS.map(key => ({ [`${key}._id`]: itemId }))
        }).populate('vendor', 'businessName email phone');
        if (!pkg) throw new Error("Item not found");

        let foundItem = null;
        let category = null;
        for (const key of SCHEMA_KEYS) {
            if (Array.isArray(pkg[key])) {
                const match = pkg[key].find(i => i._id.toString() === itemId.toString());
                if (match) {
                    foundItem = match.toObject ? match.toObject() : match;
                    category = key;
                    break;
                }
            }
        }
        if (!foundItem) throw new Error("Item not found");
        return { ...foundItem, serviceType: category, vendorId: pkg.vendor?._id || pkg.vendor, vendor: pkg.vendor };
    }

    async updatePackageItem(itemId, updateData) {
        let pkg = await Package.findOne({
            $or: SCHEMA_KEYS.map(key => ({ [`${key}._id`]: itemId }))
        });
        if (!pkg) throw new Error("Item not found");

        let found = false;
        let category = null;
        for (const key of SCHEMA_KEYS) {
            if (Array.isArray(pkg[key])) {
                const matchIndex = pkg[key].findIndex(i => i._id.toString() === itemId.toString());
                if (matchIndex !== -1) {
                    // Object.assign directly modifies the subdocument fields in Mongoose arrays correctly if handled per path, but we can also use `.set()`
                    const subdoc = pkg[key][matchIndex];
                    subdoc.set(updateData);
                    found = true;
                    category = key;
                    break;
                }
            }
        }
        if (!found) throw new Error("Item not found");
        await pkg.save();
        
        return await this.getPackageItem(itemId);
    }

    async getVendorPackages(vendorId) {
        const pkg = await Package.findOne({ vendor: vendorId }).lean();
        if (!pkg) return [];
        
        const vendorPackages = [];
        const categories = SCHEMA_KEYS;
        categories.forEach(type => {
            if (Array.isArray(pkg[type])) {
                pkg[type].forEach(service => {
                    vendorPackages.push({
                        ...service,
                        serviceType: type,
                        vendor: pkg.vendor,
                        vendorId: pkg.vendor?.toString() || null
                    });
                });
            }
        });
        return vendorPackages;
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
     * Log a user/admin action.
     * @param {string} userId - The user ID performing the action.
     * @param {string} action - 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', etc.
     * @param {string} target - 'REVIEW', 'BANNER', 'PROVIDER', 'USER'.
     * @param {string} targetId - The ID of the affected resource.
     * @param {object} details - Any metadata to store (e.g. changed fields).
     * @param {object} req - Optional: To extract IP/UA if passed.
     */
    async logAction(userId, action, target, targetId, details, req = null, session = null) {
        try {
            const sanitizedDetails = redactSensitiveData(details);
            const { ipAddress, userAgent } = getRequestMetadata(req);

            const log = new AuditLog({
                userId: userId,
                action,
                target,
                targetId,
                details: sanitizedDetails,
                ipAddress,
                userAgent
            });
            await log.save({ session });
        } catch (error) {
            // Non-blocking: Don't throw, just log the error.
        }
    }

    async getAuditLogs(filter = {}, page = 1, limit = 20) {
        const safeLimit = Math.max(1, Math.min(parseInt(limit) || 20, 500));
        const skip = (Math.max(1, parseInt(page) || 1) - 1) * safeLimit;
        const query = {};

        if (filter.userId) query.userId = filter.userId;
        if (filter.action) query.action = filter.action;
        if (filter.target) query.target = filter.target;
        if (filter.startDate) query.createdAt = { $gte: new Date(filter.startDate) };

        const logs = await AuditLog.find(query)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit);

        const total = await AuditLog.countDocuments(query);

        return { logs, total, pages: Math.ceil(total / safeLimit) };
    }

    // --- Disputes ---
    async getDisputes(filter = {}, page = 1, limit = 20) {
        const safeLimit = Math.max(1, Math.min(parseInt(limit) || 20, 500));
        const skip = (Math.max(1, parseInt(page) || 1) - 1) * safeLimit;
        const query = {};

        if (filter.status) query.status = filter.status;
        if (filter.vendorId) query.vendorId = filter.vendorId;

        const disputes = await Dispute.find(query)
            .populate('raisedBy', 'name email phone')
            .populate('vendorId', 'businessName contactEmail')
            .populate('bookingId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit);

        const total = await Dispute.countDocuments(query);
        return { disputes, total, pages: Math.ceil(total / safeLimit) };
    }

    async resolveDispute(adminId, disputeId, decision, adminNotes, req) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const dispute = await Dispute.findById(disputeId).session(session);

            if (!dispute) throw new Error('Dispute not found');
            if (['resolved_refunded', 'resolved_rejected'].includes(dispute.status)) {
                throw new Error('Dispute is already resolved');
            }

            dispute.status = decision; // 'resolved_refunded' or 'resolved_rejected' or 'investigating'
            dispute.adminNotes = adminNotes;

            if (decision.startsWith('resolved')) {
                dispute.resolvedAt = new Date();
            }

            await dispute.save({ session });

            const booking = await Booking.findById(dispute.bookingId).session(session);

            if (booking) {
                if (decision === 'resolved_refunded') {
                    // Process Traveller refund and clear payout dispute
                    booking.isDisputed = false; // Issue resolved
                    booking.status = 'cancelled';
                    booking.refundStatus = 'refunded';
                    booking.refundAmount = booking.totalPrice;

                    booking.timeline.push({
                        title: 'Dispute Resolved (Refunded)',
                        description: 'Admin resolved the dispute and processed a refund.',
                        updatedBy: adminId
                    });
                } else if (decision === 'resolved_rejected') {
                    // Traveller claim rejected, release vendor payout lock
                    booking.isDisputed = false;
                    booking.timeline.push({
                        title: 'Dispute Closed',
                        description: 'Admin reviewed and closed the dispute. Payout released.',
                        updatedBy: adminId
                    });
                } else if (decision === 'investigating') {
                    booking.timeline.push({
                        title: 'Dispute Under Investigation',
                        description: 'Admin is currently investigating the dispute.',
                        updatedBy: adminId
                    });
                }
                await booking.save({ session });
            }

            await this.logAction(adminId, 'UPDATE', 'DISPUTE', dispute._id, { status: decision }, req, session);

            await session.commitTransaction();
            return dispute;
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async getAuditLogs(filters = {}, page = 1, limit = 20) {
        const query = {};
        if (filters.userId) query.userId = filters.userId;
        if (filters.action) query.action = filters.action.toUpperCase();
        if (filters.target) query.target = filters.target.toUpperCase();
        if (filters.startDate) {
            query.createdAt = { $gte: new Date(filters.startDate) };
        }

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .populate({ path: 'userId', select: 'email role name', strictPopulate: false })
            .populate({ path: 'adminId', select: 'email role name', strictPopulate: false })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        return {
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        };
    }

    async logAction(userId, action, target, targetId, details = {}, req = null, session = null) {
        try {
            // Fallbacks for extracting IPs across different frameworks
            const ipAddress = req?.headers?.['x-forwarded-for']?.split(',')[0]
                || req?.socket?.remoteAddress
                || req?.ip
                || 'UNKNOWN';

            const userAgent = req?.headers?.['user-agent'] || 'UNKNOWN';

            const logData = {
                userId,
                adminId: userId, // Hotfix: satisfies old Mongoose cached schema during Next.js HMR
                action,
                target,
                targetId: targetId ? String(targetId) : undefined,
                details,
                ipAddress,
                userAgent
            };

            if (session) {
                await AuditLog.create([logData], { session });
            } else {
                await AuditLog.create(logData);
            }
            return true;
        } catch (error) {
            console.error("[AdminService] Failed to create AuditLog:", error.message);
            return false; // Do not crash main flow if log fails
        }
    }

    // --- Traveller Management ---
    async getAllTravellers() {
        return await User.find({ role: 'traveller' }).sort({ createdAt: -1 }).select('-password').lean();
    }

    async createTraveller(data, req) {
        const { name, email, phone, password } = data;
        const exists = await User.findOne({ email });
        if (exists) throw new Error("Email already registered");
        const user = await User.create({ name, email, phone, password, role: 'traveller', isVerified: true });
        return { _id: user._id, name: user.name, email: user.email, phone: user.phone };
    }

    async updateTraveller(id, data, req) {
        const user = await User.findById(id);
        if (!user) throw new Error("Traveller not found");
        if (data.name) user.name = data.name;
        if (data.email) user.email = data.email;
        if (data.phone !== undefined) user.phone = data.phone;
        if (data.status) user.status = data.status; 
        await user.save();
        return { _id: user._id, name: user.name, email: user.email, phone: user.phone, status: user.status };
    }

    async deleteTraveller(id) {
        return await User.findByIdAndDelete(id);
    }

    // --- Vendor Management Methods ---
    async getVendorById(id) {
        let profile = await Vendor.findById(id).populate('category').lean();
        let user = null;

        if (profile) {
            if (profile.user) user = await User.findById(profile.user).lean();
        } else {
            user = await User.findById(id).lean();
            if (user) profile = await Vendor.findOne({ user: id }).populate('category').lean();
        }

        if (!profile && !user) throw new Error("Vendor node not found");
        
        let categoryDocuments = [];
        if (profile) {
            categoryDocuments = await VendorDocument.find({ vendor_id: profile._id }).lean();
            return {
                ...profile,
                user,
                hasProfile: true,
                categoryDocuments
            };
        } else {
            return {
                ...user,
                hasProfile: false,
                businessName: 'Unregistered Node',
                isApproved: false,
                categoryDocuments: []
            };
        }
    }

    async createVendor(data, req) {
        const { businessName, ownerName, email, phone, password } = data;
        const exists = await User.findOne({ email });
        if (exists) throw new Error("Email already registered");
        const user = await User.create({ name: ownerName || businessName, email, phone, password, role: 'vendor', isVerified: true });
        const vendor = await Vendor.create({ user: user._id, businessName, ownerName, isApproved: true });
        return vendor;
    }

    async updateVendor(id, data, req) {
        const vendor = await Vendor.findById(id);
        if (!vendor) throw new Error("Vendor not found");
        if (data.businessName) vendor.businessName = data.businessName;
        if (data.ownerName) vendor.ownerName = data.ownerName;
        if (data.isApproved !== undefined) vendor.isApproved = data.isApproved;
        await vendor.save();
        
        // Also update the underlying user if email/phone provided
        if (vendor.user && (data.email || data.phone !== undefined)) {
            const user = await User.findById(vendor.user);
            if (user) {
                if (data.email) user.email = data.email;
                if (data.phone !== undefined) user.phone = data.phone;
                await user.save();
            }
        }
        
        return vendor;
    }

    async deleteVendor(id) {
        const vendor = await Vendor.findById(id);
        if (vendor && vendor.user) {
            await User.findByIdAndDelete(vendor.user);
        }
        return await Vendor.findByIdAndDelete(id);
    }
}

const adminService = new AdminService();
export default adminService;
