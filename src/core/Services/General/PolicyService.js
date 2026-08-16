import Policy from '@/core/Models/Policy.js';
import Inquiry from '@/core/Models/Inquiry.js';

/**
 * PolicyService (General Role)
 * Handles public viewing of legal policies and support inquiry submissions.
 */
class PolicyService {
  async getPolicies(target = null) {
    const filter = target ? { target } : {};
    const query = Policy.find(filter);
    return await (query?.lean ? query.lean() : query);
  }

  async getPolicy(target, type) {
    const query = Policy.findOne({ target, type });
    return await (query?.lean ? query.lean() : query);
  }

  async submitInquiry(data) {
    return await Inquiry.create(data);
  }
}

export default new PolicyService();
