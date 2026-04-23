import Policy from '@/core/Models/Policy.js';
import Inquiry from '@/core/Models/Inquiry.js';
import { sanitizeHTML } from '@/core/Helpers/security.js';

/**
 * PolicyService (Admin Role)
 * Administration of legal policies, terms, and system-wide content.
 * Also handles support inquiry lifecycle.
 */
class PolicyService {
  async getPolicies(target = null) {
    const filter = target ? { target } : {};
    return await Policy.find(filter);
  }

  async getPolicy(target, type) {
    return await Policy.findOne({ target, type });
  }

  async updatePolicy(target, type, content, adminId) {
    const sanitized = sanitizeHTML(content);
    return await Policy.findOneAndUpdate(
      { target, type },
      { content: sanitized, lastUpdatedBy: adminId },
      { returnDocument: 'after', upsert: true }
    );
  }

  async seedPolicies() {
    const defaults = [
      { target: 'traveller', type: 'terms', content: 'Initial Terms for Travellers...' },
      { target: 'vendor', type: 'terms', content: 'Initial Terms for Vendors...' },
      { target: 'system', type: 'privacy', content: 'Initial Privacy Policy...' }
    ];

    for (const p of defaults) {
      await Policy.findOneAndUpdate({ target: p.target, type: p.type }, p, { upsert: true });
    }
    return true;
  }

  // Support Inquiries
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
}

export default new PolicyService();
