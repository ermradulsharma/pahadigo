import PolicyService from '@/services/General/PolicyService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * PolicyController (General/Public Role) - Handles public viewing of site policies.
 */
class PolicyController extends Controller {

    // GET /policies/:target (Public)
    async getPoliciesByTarget(req, { params }) {
        try {
            if (!['vendor', 'traveller'].includes(params.target)) {
                return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.INVALID_DATA);
            }
            const policies = await PolicyService.getPolicies(params.target);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.FETCHED, { policies });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /policies/:target/:type (Public)
    async getPolicyByType(req, { params }) {
        try {
            const { target, type } = params;
            if (!target || !type) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

            const typeMap = {
                'privacy-policy': 'privacy_policy',
                'terms-conditions': 'terms_conditions',
                'refund-policy': 'refund_policy',
                'cancellation-policy': 'cancellation_policy'
            };

            const normalizedType = typeMap[type] || (type && type.replace ? type.replace(/-/g, '_') : type);
            const policy = await PolicyService.getPolicy(target, normalizedType);
            
            if (!policy) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.POLICY_NOT_FOUND);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.FETCHED, { policy });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const policyController = new PolicyController();
export default policyController;
