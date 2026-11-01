import VendorClosure from '@/core/Models/VendorClosure.js';
import Vendor from '@/core/Models/Vendor.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import CacheService from '@/core/Services/CacheService.js';
import { AppError } from '@/core/Errors/AppError.js';
import { getBusinessByUserId } from '@/core/Helpers/queryHelpers.js';

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
    const vendor = await getBusinessByUserId(userId, '_id user');
    if (!vendor) throw AppError.notFound(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    const closure = await VendorClosure.create({
      vendor: vendor._id,
      user: vendor.user?._id || vendor.user || userId,
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
    const updateFields = {};
    if (updateData.startDate) updateFields.startDate = updateData.startDate;
    if (updateData.endDate) updateFields.endDate = updateData.endDate;
    if (updateData.reason) updateFields.reason = updateData.reason;

    const saved = await VendorClosure.findOneAndUpdate(
      { _id: closureId, user: userId },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();
    if (!saved) throw AppError.notFound(RESPONSE_MESSAGES.CLOSURE.NOT_FOUND);

    await this.invalidateVendorCaches(userId, saved.vendor);
    return saved;
  }

  async deleteClosurePeriod(userId, closureId) {
    const res = await VendorClosure.findOneAndDelete({ _id: closureId, user: userId });
    if (res) {
      await this.invalidateVendorCaches(userId, res.vendor);
    }
    return res;
  }
}

export default new ClosureService();
