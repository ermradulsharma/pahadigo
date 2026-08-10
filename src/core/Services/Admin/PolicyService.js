import Policy from '@/core/Models/Policy.js';
import Inquiry from '@/core/Models/Inquiry.js';
import { sanitizeHTML } from '@/core/Helpers/security.js';
import AppError from '@/core/Helpers/AppError.js';

/**
 * PolicyService (Admin Role)
 * Administration of legal policies, terms, and system-wide content.
 * Also handles support inquiry lifecycle.
 */
class PolicyService {
  async getPolicies(target = null) {
    const filter = target ? { target } : {};
    return await Policy.find(filter).lean();
  }

  async getPolicy(target, type) {
    return await Policy.findOne({ target, type }).lean();
  }

  async updatePolicy(target, type, content, adminId) {
    const sanitized = sanitizeHTML(content);
    return await Policy.findOneAndUpdate(
      { target, type },
      { content: sanitized, lastUpdatedBy: adminId },
      { new: true, upsert: true }
    );
  }

  async seedPolicies() {
    const defaults = [
      { target: 'traveller', type: 'terms', content: 'Initial Terms for Travellers...' },
      { target: 'vendor', type: 'terms', content: 'Initial Terms for Vendors...' },
      { target: 'system', type: 'privacy', content: 'Initial Privacy Policy...' }
    ];

    for (const p of defaults) {
      await Policy.findOneAndUpdate({ target: p.target, type: p.type }, p, { upsert: true, new: true });
    }
    return true;
  }

  // Support Inquiries
  async submitInquiry(data) {
    return await Inquiry.create(data);
  }

  async getInquiries() {
    return await Inquiry.find().sort({ createdAt: -1 }).lean();
  }

  async updateInquiry(id, data) {
    const inquiry = await Inquiry.findByIdAndUpdate(id, data, { new: true });
    if (!inquiry) throw new AppError('Inquiry not found', 404);
    return inquiry;
  }

  async deleteInquiry(id) {
    const deleted = await Inquiry.findByIdAndDelete(id);
    if (!deleted) throw new AppError('Inquiry not found', 404);
    return deleted;
  }
}

export default new PolicyService();
