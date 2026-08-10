import PolicyService from '@/core/Services/Admin/PolicyService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const policySchema = z.object({
  target: z.enum(['traveller', 'vendor', 'system']),
  type: z.enum(['terms', 'privacy', 'about', 'refund']),
  content: z.string().min(10)
});

/**
 * PolicyController (Admin Role)
 * Administration of legal content, terms, and system-wide policies.
 */
class PolicyController extends Controller {

  // GET /admin/policies
  async getPolicies(req) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost';
      const url = new URL(req.url, baseUrl);
      const target = url.searchParams.get('target');
      const policies = await PolicyService.getPolicies(target);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.FETCHED, { policies });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/policies
  async savePolicy(req) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(policySchema, rawBody);
      
      if (!success) {
          throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
      }
      
      const { target, type, content } = data;
      const adminId = req.user?.id || null; // Assume user is attached to req
      const policy = await PolicyService.updatePolicy(target, type, content, adminId);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.UPDATED, { policy });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/policies/seed
  async seed(req) {
    try {
      await PolicyService.seedPolicies();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SEED);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const policyController = new PolicyController();
export default policyController;

