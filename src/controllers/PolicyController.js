import AdminService from '../services/AdminService.js';
import { errorResponse, successResponse } from '../helpers/response.js';

class PolicyController {
    // Helper to verify admin
    _isAdmin(req) {
        return req.user && req.user.role === 'admin';
    }

    // GET /admin/policies
    async getPolicies(req) {
        try {
            if (!this._isAdmin(req)) {
                return errorResponse(403, 'Admin access required', {});
            }

            const policies = await AdminService.getPolicies();
            return successResponse(200, 'Policies retrieved successfully', { policies });
        } catch (error) {
            console.error('Get Policies Error:', error);
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

            const policy = await AdminService.updatePolicy(target, type, content, req.user.id);
            return successResponse(200, 'Policy updated successfully', { policy });
        } catch (error) {
            console.error('Update Policy Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }
}

const policyController = new PolicyController();
export default policyController;
