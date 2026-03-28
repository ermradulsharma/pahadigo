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

const routes = Array.isArray(routesImport) ? routesImport : (routesImport.default || []);
const authRateLimiter = rateLimit({ limit: 5, windowMs: 60 * 1000 }); // 5 requests per minute

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

        // --- Rate Limiting ---
        const authLimitPaths = ['/auth/otp', '/auth/login', '/auth/verify', '/auth/forget-password', '/auth/reset-password'];
        if (authLimitPaths.some(p => path.startsWith(p))) {
            const limitResponse = await authRateLimiter(req, { params });
            if (limitResponse instanceof Response) {
                return limitResponse; // Blocked by rate limit
            }
        }

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
                if (authResult.authorized) {
                    userContext = authResult.user;
                }
            }
        }

        if (userContext) {
            req.user = userContext;
        }

        if (routeDef.roles && routeDef.roles.length > 0) {
            const roleResult = roleMiddleware({ user: userContext }, routeDef.roles);
            if (!roleResult.authorized) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, roleResult.message || RESPONSE_MESSAGES.ERROR.FORBIDDEN, {});
            }
        }

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

            // [VALIDATION] Unified Schema Validation
            if (routeDef.schema && bodyToValidate) {
                const validationResult = validate(routeDef.schema, bodyToValidate);
                if (!validationResult.success) {
                    return errorResponse(HTTP_STATUS.BAD_REQUEST, validationResult.error, {});
                }
                // Attach validated data to request for controller use
                req.validData = validationResult.data;
            }
        } catch (parseError) {
            console.error("Body Parse Error:", parseError);
            return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST, {});
        }

        // Pass extracted route params as second argument
        const result = await routeDef.handler(req, { params: routeParams });

        // Support standard Response objects (New Standard)
        if (result instanceof Response) {
            return result;
        }

        // Support Legacy Format { status, data }
        if (result && typeof result === 'object' && result.data !== undefined && (result.success !== undefined)) {
            if (result.success === false) {
                return errorResponse(result.status || HTTP_STATUS.BAD_REQUEST, result.message || RESPONSE_MESSAGES.ERROR.GENERIC, result.data);
            }
            return successResponse(result.status || HTTP_STATUS.OK, result.message || RESPONSE_MESSAGES.SUCCESS.GENERIC, result.data);
        }

        // Ensure legacy format is wrapped correctly if just arbitrary data is returned
        return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.GENERIC, result);
    } catch (error) {
        console.error("API Handler Error:", error);
        return NextResponse.json({ success: false, message: error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, data: { stack: error.stack } }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
