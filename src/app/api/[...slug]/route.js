import { NextResponse } from 'next/server';
import routesImport from '@/routes/api.js';
import dbConnect from '@/config/db.js';
import authMiddleware from '@/middleware/auth.js';
import roleMiddleware from '@/middleware/roleMiddleware.js';
import { rateLimit } from '@/middleware/rateLimit.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { sanitizeNoSQL } from '@/helpers/security.js';
import { errorResponse, successResponse } from '@/helpers/response.js';
import { parseNestedFormData } from '@/helpers/parseNestedFormData.js';
import { validate } from '@/helpers/validation.js';

// Resolve the modular routes array from the aggregate hub
const routes = Array.isArray(routesImport) ? routesImport : (routesImport.default || []);
const authRateLimiter = rateLimit({ limit: 5, windowMs: 60 * 1000 }); // 5 requests per minute

/**
 * Route Matching Engine - Finds the correct modular handler based on method and slug.
 */
function findRoute(method, slug) {
    const path = '/' + slug.join('/').replace(/\/$/, '');
    for (const route of routes) {
        if (route.method.toUpperCase() !== method.toUpperCase()) continue;
        const routePath = route.path.replace(/\/$/, '');
        const paramNames = [];
        const regexPath = routePath.replace(/:([^/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });
        const regex = new RegExp(`^${regexPath}$`);
        const match = path.match(regex);
        if (match) {
            const params = { ...(route.params || {}) };
            paramNames.forEach((name, index) => {
                params[name] = match[index + 1];
            });
            return { routeDef: route, params };
        }
    }
    return null;
}

/**
 * Universal API Handler - The single entry point for all PahadiGo role-based APIs.
 */
async function handler(req, { params }) {
    try {
        await dbConnect();
        const { slug } = await params;
        const method = req.method;
        const match = findRoute(method, slug);
        
        if (!match) {
            return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, { method, path: '/' + slug.join('/') });
        }

        const { routeDef, params: routeParams } = match;
        const path = '/' + slug.join('/').replace(/\/$/, '');
        
        // Rate Limiting for Auth Endpoints
        const authLimitPaths = ['/auth/otp', '/auth/login', '/auth/verify', '/auth/forget-password', '/auth/reset-password'];
        if (authLimitPaths.some(p => path.startsWith(p))) {
            const limitResponse = await authRateLimiter(req, { params });
            if (limitResponse instanceof Response) return limitResponse;
        }

        // Middleware Pipeline (Auth & Roles)
        let userContext = null;
        if (routeDef.middleware) {
            if (routeDef.middleware.includes('auth')) {
                const authResult = await authMiddleware(req);
                if (!authResult.authorized) {
                    return errorResponse(HTTP_STATUS.UNAUTHORIZED, authResult.message || RESPONSE_MESSAGES.ERROR.UNAUTHORIZED, {});
                }
                userContext = authResult.user;
            } else if (routeDef.middleware.includes('optionalAuth')) {
                const authResult = await authMiddleware(req);
                if (authResult.authorized) userContext = authResult.user;
            }
        }

        if (userContext) req.user = userContext;

        if (routeDef.roles && routeDef.roles.length > 0) {
            const roleResult = roleMiddleware({ user: userContext }, routeDef.roles);
            if (!roleResult.authorized) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, roleResult.message || RESPONSE_MESSAGES.ERROR.FORBIDDEN, {});
            }
        }

        // Body Parsing & Validation
        const contentType = req.headers.get('content-type') || '';
        try {
            let bodyToValidate = null;
            if (method !== 'GET' && method !== 'HEAD') {
                if (contentType.includes('multipart/form-data')) {
                    req.formDataBody = await req.formData();
                    bodyToValidate = parseNestedFormData(req.formDataBody);
                } else if (contentType.includes('application/json')) {
                    const text = await req.text();
                    if (text && text.trim().length > 0) {
                        const body = JSON.parse(text);
                        const sanitizedBody = sanitizeNoSQL(body);
                        req.jsonBody = sanitizedBody;
                        bodyToValidate = sanitizedBody;
                    }
                } else if (contentType.includes('application/x-www-form-urlencoded')) {
                    const formData = await req.formData();
                    bodyToValidate = parseNestedFormData(formData);
                    req.formDataBody = formData;
                }
            }

            if (routeDef.schema && bodyToValidate) {
                const validationResult = validate(routeDef.schema, bodyToValidate);
                if (!validationResult.success) {
                    return errorResponse(HTTP_STATUS.BAD_REQUEST, validationResult.error, {});
                }
                req.validData = validationResult.data;
            }
        } catch (parseError) {
            console.error("[BODY PARSE ERROR]", parseError);
            return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST, {});
        }

        // Execute Modular Controller Handler (Standardized by centralized apiHandler helper)
        return await routeDef.handler(req, { params: routeParams });
 
     } catch (error) {
         return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
     }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
