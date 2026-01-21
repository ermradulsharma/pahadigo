import { NextResponse } from 'next/server';
import routes from '../../../routes/api'; 
import dbConnect from '../../../config/db'; 
import authMiddleware from '../../../middleware/auth';

// Helper to match route to list
function findRoute(method, slug) {
  const path = '/' + slug.join('/');
  return routes.find(r => r.method === method && r.path === path);
}

async function handler(req, { params }) {
  await dbConnect();
  const { slug } = await params;
  const method = req.method;
  
  const routeDef = findRoute(method, slug);

  if (!routeDef) {
    return NextResponse.json({ error: 'Route not found' }, { status: 404 });
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
    // Inject user context into req if needed, or pass as second arg?
    // Since we are calling controller methods defined in pure JS, we can attach to req object if customizable, 
    // or just pass a context object. Laravel controllers usually access Request object.
    // Let's attach to req for now.
    if (userContext) {
      req.user = userContext;
    }

    const result = await routeDef.handler(req);
    return NextResponse.json(result.data, { status: result.status || 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
