import Policy from '@/models/Policy.js';
import Inquiry from '@/models/Inquiry.js';

/**
 * PolicyService (General Role)
 * Handles public viewing of legal policies and support inquiry submissions.
 */
class PolicyService {
    async getPolicies(target = null) {
        const filter = target ? { target } : {};
        return await Policy.find(filter);
    }

    async getPolicy(target, type) {
        return await Policy.findOne({ target, type });
    }

    async submitInquiry(data) {
        return await Inquiry.create(data);
    }
}

export default new PolicyService();
