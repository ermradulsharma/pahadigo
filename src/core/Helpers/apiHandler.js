import AdminService from '@/services/AdminService.js';
import { redactSensitiveData } from '@/helpers/security.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

export function apiHandler(handler) {
    return async (req, params) => {
        try {
            const response = await handler(req, params);
            if (req.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
                if (req.user && req.user.id) {
                    try {
                        const urlObj = new URL(req.url, 'http://localhost');
                        const urlParts = urlObj.pathname.split('/').filter(Boolean);
                        const ignoreList = ['api', 'create', 'update', 'delete', 'add', 'remove', 'add-item', 'update-status', 'profile', 'business', 'vendor', 'admin', 'status', 'verify', 'resolve', 'upload'];
                        const significantParts = urlParts.filter(p => !ignoreList.includes(p.toLowerCase()) && p.length !== 24 && p.length !== 36);
                        let extractedTarget = significantParts.slice(-1)[0];
                        if (!extractedTarget) {
                            extractedTarget = urlParts.length > 2 ? urlParts[urlParts.length - 2] : (urlParts[1] || 'DATA');
                        }

                        let logicalAction = 'UPDATE';
                        if (req.method.toUpperCase() === 'POST') logicalAction = 'CREATE';
                        if (req.method.toUpperCase() === 'DELETE') logicalAction = 'DELETE';

                        await AdminService.logAction(
                            req.user.id,
                            logicalAction,
                            extractedTarget.toUpperCase(), // "VENDOR", "USER", etc.
                            params?.params?.id || 'GLOBAL',
                            {
                                route: urlObj.pathname,
                                status: response?.status || 'OK',
                                payload: redactSensitiveData(req.validData || req.jsonBody || (req.formDataBody ? Object.fromEntries(req.formDataBody.entries()) : null))
                            },
                            req
                        );
                    } catch (logError) {
                        console.error("[AUTO AUDIT LOG FAIL]", logError);
                    }
                }
            }
            return response;
        } catch (err) {
            if (!handler) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.ROUTE_NOT_FOUND, {});
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, err.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    };
}
