import VendorClosure from '@/core/Models/VendorClosure.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';

class ClosureService {
  async addClosurePeriod(userId, closureData) {
    const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
    if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    const closure = await VendorClosure.create({
      vendor: vendor._id,
      user: vendor.user,
      startDate: closureData.startDate,
      endDate: closureData.endDate,
      reason: closureData.reason || 'Vacation',
      isActive: true
    });

    return closure;
  }

  async getClosurePeriods(userId) {
    return await VendorClosure.find({ user: userId, isActive: true }).sort({ startDate: 1 });
  }

  async updateClosurePeriod(userId, closureId, updateData) {
    const closure = await VendorClosure.findOne({ _id: closureId, user: userId });
    if (!closure) throw new Error(RESPONSE_MESSAGES.CLOSURE.NOT_FOUND);

    if (updateData.startDate) closure.startDate = updateData.startDate;
    if (updateData.endDate) closure.endDate = updateData.endDate;
    if (updateData.reason) closure.reason = updateData.reason;

    return await closure.save();
  }

  async deleteClosurePeriod(userId, closureId) {
    return await VendorClosure.findOneAndDelete({ _id: closureId, user: userId });
  }

  // --- INDUSTRY STANDARD ALIASES ---
  async createClosurePeriod(...args) { return this.addClosurePeriod(...args); }
  async removeClosurePeriod(...args) { return this.deleteClosurePeriod(...args); }
}

export default new ClosureService();
