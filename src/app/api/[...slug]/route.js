import { NextResponse } from 'next/server';
import routesImport from '@/routes/api.js';
import dbConnect from '@/config/db.js';
import authMiddleware from '@/middleware/auth.js';
import { rateLimit } from '@/middleware/rateLimit.js';
import { HTTP_STATUS } from '@/constants/index.js';
import { sanitizeNoSQL } from '@/helpers/security.js';

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
            return NextResponse.json({
                success: false,
                message: 'Route not found',
                data: { method, path: '/' + slug.join('/') }
            }, { status: HTTP_STATUS.NOT_FOUND });
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
        if (routeDef.middleware && routeDef.middleware.includes('auth')) {
            const authResult = await authMiddleware(req);
            if (!authResult.authorized) {
                return NextResponse.json({
                    success: false,
                    message: authResult.message || 'Unauthorized access',
                    data: {}
                }, { status: HTTP_STATUS.UNAUTHORIZED });
            }
            userContext = authResult.user;
        }

        if (userContext) {
            req.user = userContext;
        }

        const contentType = req.headers.get('content-type') || '';
        try {
            if (contentType.includes('multipart/form-data')) {
                req.formDataBody = await req.formData();
            } else if (contentType.includes('application/json')) {
                const body = await req.json();
                const sanitizedBody = sanitizeNoSQL(body);
                req.jsonBody = sanitizedBody;

                // [VALIDATION] Unified Schema Validation
                if (routeDef.schema) {
                    const { validate } = await import('@/helpers/validation.js');
                    const validationResult = validate(routeDef.schema, sanitizedBody);
                    if (!validationResult.success) {
                        return NextResponse.json({
                            success: false,
                            message: validationResult.error,
                            data: {}
                        }, { status: HTTP_STATUS.BAD_REQUEST });
                    }
                    // Attach validated data to request for controller use
                    req.validData = validationResult.data;
                }
            }
        } catch (parseError) {
            console.warn("API: Body parsing attempt failed (might be already consumed or empty):", parseError.message);
        }

        // Pass extracted route params as second argument
        const result = await routeDef.handler(req, { params: routeParams });

        // Support standard Response objects (New Standard)
        if (result instanceof Response) {
            return result;
        }

        // Support Legacy Format { status, data }
        if (result && typeof result === 'object' && result.data && (result.success !== undefined)) {
            return NextResponse.json(result, { status: result.status || HTTP_STATUS.OK });
        }

        // Ensure legacy format is wrapped correctly
        return NextResponse.json({
            success: result.success ?? true,
            message: result.message ?? 'Success',
            data: result.data ?? result
        }, { status: result.status || HTTP_STATUS.OK });
    } catch (error) {
        console.error("API Handler Error:", error);
        return NextResponse.json({
            success: false,
            message: 'Internal Server Error',
            error: error.message
        }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
