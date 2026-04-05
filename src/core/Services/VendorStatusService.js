import Vendor from '@/models/Vendor.js';
import User from '@/models/User.js';
import VendorClosure from '@/models/VendorClosure.js';
import { STATUS } from '@/constants/index.js';

class VendorStatusService {
    constructor() {
        this.restrictedStatuses = [STATUS.BLOCKED, STATUS.DELETED, STATUS.SUSPENDED];
        this.activeStatus = STATUS.ACTIVE;
        this.pendingStatus = STATUS.PENDING;
        this.rejectStatus = STATUS.REJECT;
    }

    /**
     * Checks if a vendor can create or update their business profile.
     * Allowed for: PENDING, ACTIVE, REJECT.
     */
    async canManageBusinessProfile(userId) {
        const user = await User.findById(userId).lean();
        if (!user) return { allowed: false, message: "User not found" };

        const allowedStates = [this.pendingStatus, this.activeStatus, this.rejectStatus];
        if (allowedStates.includes(user.status)) {
            return { allowed: true };
        }

        return { allowed: false, message: `Access denied: Profile management not allowed for status ${user.status}` };
    }

    /**
     * Comprehensive check: User status & Vendor business status.
     * Checks if a vendor is allowed to operate (add items, accept bookings, etc.).
     */
    async isVendorAllowedToOperate(userId) {
        // 1. Check User Account Status
        const user = await User.findById(userId).lean();
        if (!user) return { allowed: false, message: "User not found" };

        // Strictly block only if explicitly Restricted
        if (this.restrictedStatuses.includes(user.status) || user.deletedAt) {
            return { allowed: false, message: `Access denied: Account is ${user.status || 'inactive'}` };
        }

        // 2. Check Vendor Business Profile Status
        const vendor = await Vendor.findOne({ user: userId, deletedAt: null }).lean();
        if (!user) return { allowed: false, message: "Business profile not found" };

        // Block if Business itself is Restricted
        if (this.restrictedStatuses.includes(vendor.status) || vendor.deletedAt) {
            return { allowed: false, message: `Access denied: Business is ${vendor.status || 'inactive'}` };
        }

        // NOTE: We allow operations (add items) even if status is 'pending' or 'reject'
        // so that vendors can prepare their catalog or fix issues after a rejection.
        
        return { allowed: true, vendor };
    }

    /**
     * Checks availability for customer-facing displays (includes closure periods).
     */
    async isVendorAvailable(vendorIdOrUser, isUserId = true) {
        const query = isUserId ? { user: vendorIdOrUser } : { _id: vendorIdOrUser };
        const vendor = await Vendor.findOne({ ...query, deletedAt: null }).lean();

        if (!vendor || vendor.status !== this.activeStatus) return false;

        // Check for closure periods in the NEW model
        const now = new Date();
        const closure = await VendorClosure.findOne({
            vendor: vendor._id,
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        if (closure) return false;

        return true;
    }

    /**
     * Aggregation helper to filter out inactive vendors in pipelines.
     */
    getVendorClosureFilterStages(vendorField = 'vendorProfile') {
        const now = new Date();
        return [
            // Join with VendorClosure to check for overlapping active closures
            {
                $lookup: {
                    from: 'vendorclosures',
                    let: { vendorId: `$${vendorField}._id` },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$vendor", "$$vendorId"] },
                                        { $eq: ["$isActive", true] },
                                        { $lte: ["$startDate", now] },
                                        { $gte: ["$endDate", now] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'activeClosures'
                }
            },
            // Filter out items where vendor has an active closure
            { $match: { "activeClosures": { $size: 0 } } },
            // Clean up the lookup field
            { $project: { activeClosures: 0 } }
        ];
    }

    /**
     * Standard query helper for find() calls.
     * Note: date range check now handled separately via isVendorAvailable.
     */
    getVendorClosureQuery(prefix = '') {
        const p = prefix ? `${prefix}.` : '';
        return {
            [`${p}status`]: this.activeStatus
        };
    }
}

const vendorStatusService = new VendorStatusService();
export default vendorStatusService;
