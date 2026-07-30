import { randomUUID } from 'node:crypto';
import FindMyWay from 'find-my-way';
import dbConnect from '@/core/Config/db.js';
import authMiddleware from '@/core/Middleware/auth.js';
import roleMiddleware from '@/core/Middleware/roleMiddleware.js';
import { rateLimit } from '@/core/Middleware/rateLimit.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { sanitizeNoSQL } from '@/core/Helpers/security.js';
import { errorResponse } from '@/core/Helpers/response.js';
import { parseNestedFormData } from '@/core/Helpers/parseNestedFormData.js';
import { validate } from '@/core/Helpers/validation.js';

const authRateLimiter = rateLimit({ limit: 5, windowMs: 60 * 1000 }); // 5 requests per minute
const REQUEST_ID_HEADER = 'x-request-id';

const withRequestId = (response, requestId) => {
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
};

const logError = (message, error, metadata = {}) => {
    console.error(message, {
        ...metadata,
        error: error?.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
};

/**
 * Creates a reusable Next.js API route handler for a specific set of domain routes.
 * @param {Array} routes - Array of route definitions (e.g., vendorRoutes, adminRoutes)
 */
export function createNextRouter(routes) {
    const router = FindMyWay({ defaultRoute: () => null });

    // Register all routes for this specific domain
    (Array.isArray(routes) ? routes : []).forEach(route => {
        const method = Array.isArray(route.method)
            ? route.method.map(m => m.toUpperCase())
            : route.method.toUpperCase();

        let path = route.path.replace(/\/$/, '') || '/';

        router.on(method, path, (req, res, params, store) => {
            return { routeDef: route, params };
        });
    });

    return async function handler(req, { params }) {
        const requestId = req.headers.get(REQUEST_ID_HEADER) || randomUUID();
        req.requestId = requestId;

        try {
            await dbConnect();
            const method = req.method;

            // Extract the absolute path from the Request URL and strip the /api prefix
            const urlObj = new URL(req.url);
            let path = urlObj.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';

            const match = router.find(method.toUpperCase(), path);

            if (!match) {
                return withRequestId(errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, { method, path }), requestId);
            }

            const { routeDef, params: routeParams } = match.handler(null, null, match.params, match.store);

            // Rate Limiting for Auth Endpoints
            const authLimitPaths = ['/auth/otp', '/auth/login', '/auth/verify', '/auth/forget-password', '/auth/reset-password'];
            if (authLimitPaths.some(p => path.startsWith(p))) {
                const limitResponse = await authRateLimiter(req, { params });
                if (limitResponse instanceof Response) return withRequestId(limitResponse, requestId);
            }

            // Middleware Pipeline (Auth & Roles)
            let userContext = null;
            if (routeDef.middleware) {
                if (routeDef.middleware.includes('auth')) {
                    const authResult = await authMiddleware(req);
                    if (!authResult.authorized) {
                        return withRequestId(errorResponse(HTTP_STATUS.UNAUTHORIZED, authResult.message || RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {}), requestId);
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
                    return withRequestId(errorResponse(HTTP_STATUS.FORBIDDEN, roleResult.message || RESPONSE_MESSAGES.ERROR.FORBIDDEN, {}), requestId);
                }
            }

            // Body Parsing & Validation
            const contentType = req.headers.get('content-type') || '';
            try {
                let bodyToValidate;
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
                        } else {
                            bodyToValidate = {};
                            req.jsonBody = bodyToValidate;
                        }
                    } else if (contentType.includes('application/x-www-form-urlencoded')) {
                        const formData = await req.formData();
                        bodyToValidate = parseNestedFormData(formData);
                        req.formDataBody = formData;
                    } else if (routeDef.schema) {
                        bodyToValidate = {};
                    }
                }

                if (routeDef.schema) {
                    const validationResult = validate(routeDef.schema, bodyToValidate ?? {});
                    if (!validationResult.success) {
                        return withRequestId(errorResponse(HTTP_STATUS.BAD_REQUEST, validationResult.error, {}), requestId);
                    }
                    req.validData = validationResult.data;
                    req.payload = validationResult.data;
                } else if (bodyToValidate !== undefined) {
                    req.payload = bodyToValidate;
                }
            } catch (parseError) {
                logError('[BODY PARSE ERROR]', parseError, { requestId, method, path });
                return withRequestId(errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST, {}), requestId);
            }

            // NoSQL Injection Sanitization for Query Params & Route Params
            try {
                const rawQuery = Object.fromEntries(urlObj.searchParams.entries());
                req.query = sanitizeNoSQL(rawQuery);
            } catch {
                req.query = {};
            }

            const sanitizedRouteParams = sanitizeNoSQL({ ...routeParams });

            // Execute Modular Controller Handler
            return withRequestId(await routeDef.handler(req, { params: sanitizedRouteParams }), requestId);

        } catch (error) {
            logError('[API HANDLER ERROR]', error, { requestId, method: req.method, path: req.url });
            return withRequestId(errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}), requestId);
        }
    };
}
