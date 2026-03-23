import AdminService from '@/services/AdminService.js';
import { errorResponse, successResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { seedPolicies } from '@/seeders/policySeeder.js';

class PolicyController {
    // GET /admin/policies
    async getPolicies(req) {
        try {
            if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, 'Unauthorized error', {});
            }

            const { searchParams } = new URL(req.url);
            const target = searchParams.get('target');

            const policies = await AdminService.getPolicies(target);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.FETCHED, { policies });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
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
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.FETCHED, { policies });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /policies/:target/:type (Public)
    async getPolicyByType(req, { params }) {
        try {
            const { target, type } = await params;
            if (!target || !type) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

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

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.FETCHED, { policy });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // POST /admin/policies
    async updatePolicy(req) {
        try {
            const body = req.jsonBody || await req.json();
            const { target, type, content } = body;
            if (!target || !type || content === undefined) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const allowedTypes = {
                admin: ['privacy_policy', 'terms_conditions'],
                vendor: ['privacy_policy', 'terms_conditions'],
                traveller: ['privacy_policy', 'terms_conditions', 'refund_policy', 'cancellation_policy']
            };

            if (!allowedTypes[target] || !allowedTypes[target].includes(type)) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.INVALID_DATA, {});
            }

            const policy = await AdminService.updatePolicy(target, type, content, req.user.id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.POLICY.UPDATED, { policy });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // POST /admin/policies/seed
    async seed(req) {
        try {
            const result = await seedPolicies();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SEED, { result });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }
}

const policyController = new PolicyController();
export default policyController;