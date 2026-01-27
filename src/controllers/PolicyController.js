import AdminService from '../services/AdminService.js';
import { errorResponse, successResponse } from '../helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/index.js';

class PolicyController {
    // Helper to verify admin
    _isAdmin(req) {
        return req.user && req.user.role === 'admin';
    }

    // GET /admin/policies
    // GET /admin/policies
    async getPolicies(req) {
        try {
            if (!this._isAdmin(req)) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.ADMIN_ONLY, {});
            }

            const { searchParams } = new URL(req.url);
            const target = searchParams.get('target');

            const policies = await AdminService.getPolicies(target);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { policies });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /policies/:target (Public)
    async getPoliciesByTarget(req, { params }) {
        try {
            const { target } = await params;
            if (!['vendor', 'traveller'].includes(target)) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.INVALID_DATA, {});
            }

            const policies = await AdminService.getPolicies(target);
            return successResponse(HTTP_STATUS.OK, `${target} policies retrieved successfully`, { policies });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /policies/:target/:type (Public)
    async getPolicyByType(req, { params }) {
        try {
            const { target, type } = await params;
            if (!target || !type) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            // Map common synonyms to DB enums
            const typeMap = {
                'privacy-policy': 'privacy_policy',
                'terms-conditions': 'terms_conditions',
                'refund-policy': 'refund_policy',
                'cancellation-policy': 'cancellation_policy'
            };

            const normalizedType = typeMap[type] || (type && type.replace ? type.replace(/-/g, '_') : type);

            const policy = await AdminService.getPolicy(target, normalizedType);
            if (!policy) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.POLICY_NOT_FOUND, {});
            }

            return successResponse(HTTP_STATUS.OK, `${target} ${type} retrieved successfully`, { policy });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /admin/policies
    async updatePolicy(req) {
        try {
            if (!this._isAdmin(req)) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.ADMIN_ONLY, {});
            }
            const body = req.jsonBody || await req.json();
            const { target, type, content } = body;
            if (!target || !type || content === undefined) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            // Target-specific validation
            const allowedTypes = {
                vendor: ['privacy_policy', 'terms_conditions'],
                traveller: ['privacy_policy', 'terms_conditions', 'refund_policy', 'cancellation_policy']
            };

            if (!allowedTypes[target]) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.INVALID_DATA, {});
            }

            if (!allowedTypes[target].includes(type)) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, `Type "${type}" is not allowed for target "${target}"`, {});
            }

            const policy = await AdminService.updatePolicy(target, type, content, req.user.id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, { policy });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /admin/policies/seed
    async seed(req) {
        try {
            if (!this._isAdmin(req)) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.ADMIN_ONLY, {});
            }
            const { seedPolicies } = await import('../seeders/policySeeder.js');
            const result = await seedPolicies();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SEED, { result });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }
}

const policyController = new PolicyController();
export default policyController;
