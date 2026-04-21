import PolicyService from '../../../Services/Admin/PolicyService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * PolicyController (Admin Role)
 * Administration of legal content, terms, and system-wide policies.
 */
class PolicyController extends Controller {

  // GET /admin/policies
  async getPolicies(req) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const target = url.searchParams.get('target');
      const policies = await PolicyService.getPolicies(target);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.FETCHED, { policies });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/policies
  async savePolicy(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const { target, type, content } = body;
      if (!target || !type || !content) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

      const policy = await PolicyService.updatePolicy(target, type, content, req.user.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.UPDATED, { policy });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/policies/seed
  async seed(req) {
    try {
      await PolicyService.seedPolicies();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SEED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const policyController = new PolicyController();
export default policyController;
