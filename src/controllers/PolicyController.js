import AdminService from '../services/AdminService.js';
import { errorResponse, successResponse } from '../helpers/response.js';

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
                return errorResponse(403, 'Admin access required', {});
            }

            const { searchParams } = new URL(req.url);
            const target = searchParams.get('target');

            const policies = await AdminService.getPolicies(target);
            return successResponse(200, 'Policies retrieved successfully', { policies });
        } catch (error) {
            console.error('Get Policies Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /policies/:target (Public)
    async getPoliciesByTarget(req, { params }) {
        try {
            const { target } = await params;
            if (!['vendor', 'traveller'].includes(target)) {
                return errorResponse(400, 'Invalid target', {});
            }

            const policies = await AdminService.getPolicies(target);
            return successResponse(200, `${target} policies retrieved successfully`, { policies });
        } catch (error) {
            console.error('Get Target Policies Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /policies/:target/:type (Public)
    async getPolicyByType(req, { params }) {
        try {
            const { target, type } = await params;
            if (!target || !type) {
                return errorResponse(400, 'Missing target or type', {});
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
                return errorResponse(404, 'Policy not found', {});
            }

            return successResponse(200, `${target} ${type} retrieved successfully`, { policy });
        } catch (error) {
            console.error('Get Policy Type Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /admin/policies
    async updatePolicy(req) {
        try {
            if (!this._isAdmin(req)) {
                return errorResponse(403, 'Admin access required', {});
            }
            const body = req.jsonBody || await req.json();
            const { target, type, content } = body;
            if (!target || !type || content === undefined) {
                return errorResponse(400, 'All fields are required', {});
            }

            // Target-specific validation
            const allowedTypes = {
                vendor: ['privacy_policy', 'terms_conditions'],
                traveller: ['privacy_policy', 'terms_conditions', 'refund_policy', 'cancellation_policy']
            };

            if (!allowedTypes[target]) {
                return errorResponse(400, 'Invalid target', {});
            }

            if (!allowedTypes[target].includes(type)) {
                return errorResponse(400, `Type "${type}" is not allowed for target "${target}"`, {});
            }

            const policy = await AdminService.updatePolicy(target, type, content, req.user.id);
            return successResponse(200, 'Policy updated successfully', { policy });
        } catch (error) {
            console.error('Update Policy Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /admin/policies/seed
    async seed(req) {
        try {
            if (!this._isAdmin(req)) {
                return errorResponse(403, 'Admin access required', {});
            }
            const { seedPolicies } = await import('../seeders/policySeeder.js');
            const result = await seedPolicies();
            return successResponse(200, 'Policies seeded successfully', { result });
        } catch (error) {
            console.error('Seed Policies Error:', error);
            return errorResponse(500, error.message, {});
        }
    }
}

const policyController = new PolicyController();
export default policyController;
