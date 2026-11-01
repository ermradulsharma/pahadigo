import { getPoliciesBy, getPolicyBy } from '@/core/Helpers/queryHelpers.js';
import Inquiry from '@/core/Models/Inquiry.js';

/**
 * PolicyService (General Role)
 * Handles public viewing of legal policies and support inquiry submissions.
 */
class PolicyService {
    async getPolicies(target = null) {
        const filter = target ? { target } : {};
        return await getPoliciesBy(filter);
    }

    async getPolicy(target, type) {
        return await getPolicyBy({ target, type });
    }

    async submitInquiry(data) {
        return await Inquiry.create(data);
    }
}

export default new PolicyService();
