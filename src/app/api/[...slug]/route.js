import { NextResponse } from 'next/server';
import routesImport from '../../../routes/api';
import dbConnect from '../../../config/db';
import authMiddleware from '../../../middleware/auth';

// Ensure routes is an array even if imported as CommonJS default object
const routes = Array.isArray(routesImport) ? routesImport : (routesImport.default || []);

// Helper to match route to list
function findRoute(method, slug) {
  // Normalize slug: join and remove possible trailing slash
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

  // Middleware execution
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

    // Determine how to parse body based on Content-Type
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      req.formDataBody = await req.formData();
    } else if (contentType.includes('application/json')) {
      req.jsonBody = await req.json();
    }

    const result = await routeDef.handler(req);
    return NextResponse.json(result.data, { status: result.status || 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
