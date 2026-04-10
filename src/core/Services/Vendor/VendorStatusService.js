import Vendor from '@/models/Vendor.js';
import User from '@/models/User.js';
import VendorClosure from '@/models/VendorClosure.js';
import { STATUS } from '@/constants/index.js';

/**
 * VendorStatusService (Vendor Role)
 * Focuses on business rules for profile management and operational availability.
 */
class VendorStatusService {
    constructor() {
        this.restrictedStatuses = [STATUS.BLOCKED, STATUS.DELETED, STATUS.SUSPENDED];
        this.activeStatus = STATUS.ACTIVE;
        this.pendingStatus = STATUS.PENDING;
        this.rejectStatus = STATUS.REJECT;
    }

    /**
     * Checks if a vendor can create or update their profile.
     */
    async canManageProfile(userId) {
        const user = await User.findById(userId).lean();
        if (!user) return { allowed: false, message: "User not found" };

        const allowedStates = [this.pendingStatus, this.activeStatus, this.rejectStatus];
        if (allowedStates.includes(user.status)) {
            return { allowed: true };
        }

        return { allowed: false, message: `Access denied: Profile management not allowed for status ${user.status}` };
    }

    /**
     * Checks if a vendor is allowed to operate.
     */
    async canOperate(userId) {
        const user = await User.findById(userId).lean();
        if (!user) return { allowed: false, message: "User not found" };

        if (this.restrictedStatuses.includes(user.status) || user.deletedAt) {
            return { allowed: false, message: `Access denied: Account is ${user.status || 'inactive'}` };
        }

        const vendor = await Vendor.findOne({ user: userId, deletedAt: null }).lean();
        if (!vendor) return { allowed: false, message: "Business profile not found" };

        if (this.restrictedStatuses.includes(vendor.status) || vendor.deletedAt) {
            return { allowed: false, message: `Access denied: Business is ${vendor.status || 'inactive'}` };
        }

        return { allowed: true, vendor };
    }

    /**
     * Checks current operational status.
     */
    async isOperational(vendorIdOrUser, isUserId = true) {
        const query = isUserId ? { user: vendorIdOrUser } : { _id: vendorIdOrUser };
        const vendor = await Vendor.findOne({ ...query, deletedAt: null }).lean();

        if (!vendor || vendor.status !== this.activeStatus || !vendor.isOperating) return false;

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
}

export default new VendorStatusService();
