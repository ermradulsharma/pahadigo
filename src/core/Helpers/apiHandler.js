import { HTTP_STATUS, RESPONSE_MESSAGES, DEFAULTS } from '@/core/Constants/index.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import { redactSensitiveData, sanitizeNoSQL } from '@/core/Helpers/security.js';
import { successResponse, errorResponse } from '@/core/Helpers/response.js';
import { parseNestedFormData } from '@/core/Helpers/parseNestedFormData.js';

export function apiHandler(handler) {
    return async (req, params) => {
        try {
            let payload = req.validData || req.jsonBody || (req.formDataBody ? parseNestedFormData(req.formDataBody) : {});
            req.payload = payload;
            sanitizeNoSQL(req.payload);
            const response = await handler(req, params);
            if (req._auditLogged) return response;
            if (req.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
                if (req.user && req.user.id) {
                    try {
                        const urlObj = new URL(req.url);
                        const urlParts = urlObj.pathname.split('/').filter(Boolean);
                        const ignoreList = ['api', 'create', 'update', 'delete', 'add', 'remove', 'add-item', 'update-status', 'profile', 'business', 'vendor', 'admin', 'status', 'verify', 'resolve', 'upload'];
                        const significantParts = urlParts.filter(p => !ignoreList.includes(p.toLowerCase()) && !/^[0-9a-fA-F]{24}$/.test(p) && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(p));
                        let extractedTarget = significantParts.slice(-1)[0];
                        if (!extractedTarget) {
                            extractedTarget = urlParts.length > 2 ? urlParts[urlParts.length - 2] : (urlParts[1] || 'DATA');
                        }

                        let logicalAction = 'UPDATE';
                        if (req.method.toUpperCase() === 'POST') logicalAction = 'CREATE';
                        if (req.method.toUpperCase() === 'DELETE') logicalAction = 'DELETE';

                        await AuditService.logAction(req.user.id, logicalAction, extractedTarget.toUpperCase(), params?.params?.id || 'GLOBAL', {
                            route: urlObj.pathname,
                            status: response?.status || 'OK',
                            payload: redactSensitiveData(req.payload)
                        }, req);
                    } catch (logError) {
                        // Silent fail for logging errors to avoid blocking the main response
                    }
                }
            }

            // Standardize Response: If handler returns a raw object, wrap it correctly
            if (response instanceof Response) return response;

            if (response && typeof response === 'object' && response.data !== undefined && response.success !== undefined) {
                if (response.success === DEFAULTS.FALSE) {
                    return errorResponse(response.status || HTTP_STATUS.BAD_REQUEST, response.message || RESPONSE_MESSAGES.ERROR.GENERIC, response.data);
                }
                return successResponse(response.status || HTTP_STATUS.OK, response.message || RESPONSE_MESSAGES.SUCCESS.GENERIC, response.data);
            }

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.GENERIC, response);
        } catch (err) {
            if (!handler) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.ROUTE_NOT_FOUND, {});
            
            // Handle specific Database/Validation Errors
            if (err.name === 'ValidationError') {
                const messages = Object.values(err.errors).map(val => val.message).join(', ');
                return errorResponse(HTTP_STATUS.BAD_REQUEST, messages, {});
            }
            if (err.name === 'CastError') {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, `Invalid value for ${err.path}`, {});
            }

            const status = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
            return errorResponse(status, err.message, {});
        }
    };
}

export default apiHandler;
