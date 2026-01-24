import { NextResponse } from 'next/server';
import routesImport from '../../../routes/api.js';
import dbConnect from '../../../config/db.js';
import authMiddleware from '../../../middleware/auth.js';

const routes = Array.isArray(routesImport) ? routesImport : (routesImport.default || []);

function findRoute(method, slug) {
    const path = '/' + slug.join('/').replace(/\/$/, '');
    return routes.find(r =>
        r.method.toUpperCase() === method.toUpperCase() &&
        r.path.replace(/\/$/, '') === path
    );
}

async function handler(req, { params }) {
    await dbConnect();
    const { slug } = await params;
    const method = req.method;
    const routeDef = findRoute(method, slug);
    if (!routeDef) {
        return NextResponse.json({
            error: 'Route not found',
            debug: { method, path: '/' + slug.join('/') }
        }, { status: 404 });
    }
    let userContext = null;
    if (routeDef.middleware && routeDef.middleware.includes('auth')) {
        const authResult = await authMiddleware(req);
        if (!authResult.authorized) {
            return NextResponse.json({ error: authResult.message }, { status: 401 });
        }
        userContext = authResult.user;
        console.log(`[API] Middleware Authenticated User ID: ${userContext.id} (Role: ${userContext.role})`);
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
                // Only read if not already read (NextRequest body can be read once)
                // However, checking 'bodyUsed' might be needed, or we rely on catch
                req.jsonBody = await req.json();
            }
        } catch (parseError) {
            // If body already read or other error, meaningful to log but continue
            console.warn("API: Body parsing attempt failed (might be already consumed or empty):", parseError.message);
        }

        const result = await routeDef.handler(req);

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
