import VendorClosure from '@/core/Models/VendorClosure.js';
import Vendor from '@/core/Models/Vendor.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import CacheService from '@/core/Services/CacheService.js';

class ClosureService {
  async invalidateVendorCaches(userId, vendorId = null) {
    await CacheService.del('admin:vendors:all');
    await CacheService.del('admin:dashboard:stats');
    if (userId) {
      await CacheService.del(`admin:vendors:${userId}`);
      await CacheService.del(`user:profile:${userId}`);
    }
    if (vendorId) {
      await CacheService.del(`admin:vendors:${vendorId}`);
    }
  }

  async addClosurePeriod(userId, closureData) {
    const vendor = await Vendor.findOne({ user: userId, deletedAt: null }).lean();
    if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    const closure = await VendorClosure.create({
      vendor: vendor._id,
      user: vendor.user,
      startDate: closureData.startDate,
      endDate: closureData.endDate,
      reason: closureData.reason || 'Vacation',
      isActive: true
    });

    await this.invalidateVendorCaches(userId, vendor._id);
    return closure;
  }

  async getClosurePeriods(userId) {
    return await VendorClosure.find({ user: userId, isActive: true }).sort({ startDate: 1 }).lean();
  }

  async updateClosurePeriod(userId, closureId, updateData) {
    const closure = await VendorClosure.findOne({ _id: closureId, user: userId });
    if (!closure) throw new Error(RESPONSE_MESSAGES.CLOSURE.NOT_FOUND);

    if (updateData.startDate) closure.startDate = updateData.startDate;
    if (updateData.endDate) closure.endDate = updateData.endDate;
    if (updateData.reason) closure.reason = updateData.reason;

    const saved = await closure.save();
    await this.invalidateVendorCaches(userId, closure.vendor);
    return saved;
  }

  async deleteClosurePeriod(userId, closureId) {
    const res = await VendorClosure.findOneAndDelete({ _id: closureId, user: userId });
    if (res) {
      await this.invalidateVendorCaches(userId, res.vendor);
    }
    return res;
  }

  // --- INDUSTRY STANDARD ALIASES ---
  async createClosurePeriod(...args) { return this.addClosurePeriod(...args); }
  async removeClosurePeriod(...args) { return this.deleteClosurePeriod(...args); }
}

export default new ClosureService();
