import { NextResponse } from 'next/server';
import routesImport from '../../../routes/api.js';
import dbConnect from '../../../config/db.js';
import authMiddleware from '../../../middleware/auth.js';

const routes = Array.isArray(routesImport) ? routesImport : (routesImport.default || []);

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
            const params = {};
            paramNames.forEach((name, index) => {
                params[name] = match[index + 1];
            });
            return { routeDef: route, params };
        }
    }
    return null;
}

async function handler(req, { params }) {
    await dbConnect();
    const { slug } = await params;
    const method = req.method;
    const match = findRoute(method, slug);

    if (!match) {
        return NextResponse.json({
            error: 'Route not found',
            debug: { method, path: '/' + slug.join('/') }
        }, { status: 404 });
    }
    const { routeDef, params: routeParams } = match;
    let userContext = null;
    if (routeDef.middleware && routeDef.middleware.includes('auth')) {
        const authResult = await authMiddleware(req);
        if (!authResult.authorized) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }
        userContext = authResult.user;
    }

    try {
        if (userContext) {
            req.user = userContext;
        }

        const contentType = req.headers.get('content-type') || '';
        try {
            if (contentType.includes('multipart/form-data')) {
                req.formDataBody = await req.formData();
            } else if (contentType.includes('application/json')) {
                req.jsonBody = await req.json();
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
        return NextResponse.json(result.data, { status: result.status || 200 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
