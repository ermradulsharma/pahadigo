import { randomUUID } from 'node:crypto';
import routesImport from '@/core/Routes/api.js';
import dbConnect from '@/core/Config/db.js';
import authMiddleware from '@/core/Middleware/auth.js';
import roleMiddleware from '@/core/Middleware/roleMiddleware.js';
import { rateLimit } from '@/core/Middleware/rateLimit.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { sanitizeNoSQL } from '@/core/Helpers/security.js';
import { errorResponse } from '@/core/Helpers/response.js';
import { parseNestedFormData } from '@/core/Helpers/parseNestedFormData.js';
import { validate } from '@/core/Helpers/validation.js';

// Resolve the modular routes array from the aggregate hub
const routes = Array.isArray(routesImport) ? routesImport : (routesImport.default || []);
const authRateLimiter = rateLimit({ limit: 5, windowMs: 60 * 1000 }); // 5 requests per minute
const REQUEST_ID_HEADER = 'x-request-id';

const normalizePath = (path) => {
  const normalized = `/${path.filter(Boolean).join('/')}`.replace(/\/$/, '');
  return normalized || '/';
};

import FindMyWay from 'find-my-way';

const router = FindMyWay({ 
  defaultRoute: () => null 
});

routes.forEach(route => {
  const method = Array.isArray(route.method) 
    ? route.method.map(m => m.toUpperCase()) 
    : route.method.toUpperCase();
    
  let path = route.path.replace(/\/$/, '') || '/';
  
  // find-my-way uses :param format just like the legacy router
  router.on(method, path, (req, res, params, store) => {
    return { routeDef: route, params };
  });
});

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
 * Route Matching Engine - Finds the correct modular handler based on method and slug.
 */
function findRoute(method, slug) {
  const path = normalizePath(slug);
  const match = router.find(method.toUpperCase(), path);
  if (match && match.handler) {
    return match.handler(null, null, match.params, match.store);
  }
  return null;
}

/**
 * Universal API Handler - The single entry point for all PahadiGo role-based APIs.
 */
async function handler(req, { params }) {
  const requestId = req.headers.get(REQUEST_ID_HEADER) || randomUUID();
  req.requestId = requestId;

  try {
    await dbConnect();
    const { slug = [] } = await params;
    const method = req.method;
    const path = normalizePath(slug);
    const match = findRoute(method, slug);

    if (!match) {
      return withRequestId(errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, { method, path }), requestId);
    }

    const { routeDef, params: routeParams } = match;

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

    // --- NoSQL Injection Sanitization for Query Params & Route Params ---
    // Body is sanitized earlier during parsing. Here we sanitize URL params.
    try {
      const urlObj = new URL(req.url);
      const rawQuery = Object.fromEntries(urlObj.searchParams.entries());
      req.query = sanitizeNoSQL(rawQuery);
    } catch {
      req.query = {};
    }
    // Sanitize dynamic route params (e.g., /:id)
    const sanitizedRouteParams = sanitizeNoSQL({ ...routeParams });

    // Execute Modular Controller Handler (Standardized by centralized apiHandler helper)
    return withRequestId(await routeDef.handler(req, { params: sanitizedRouteParams }), requestId);

  } catch (error) {
    logError('[API HANDLER ERROR]', error, { requestId, method: req.method, path: req.url });
    return withRequestId(errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}), requestId);
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
