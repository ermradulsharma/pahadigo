import { NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware
 * Intercepts EVERY single HTTP request (Pages & API endpoints) at the edge.
 */
export function middleware(request) {
    const response = NextResponse.next();

    // 1. Request ID Tracing (x-request-id)
    const existingRequestId = request.headers.get('x-request-id');
    const requestId = existingRequestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    response.headers.set('x-request-id', requestId);

    // 2. Global Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 3. CORS Headers for Mobile API Endpoints (/api/v1/*)
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
        const origin = request.headers.get('origin') || '*';
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id, x-client-device');
        response.headers.set('Access-Control-Allow-Credentials', 'true');

        // Handle preflight CORS OPTIONS request early
        if (request.method === 'OPTIONS') return new NextResponse(null, { status: 204, headers: response.headers });
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except static files, _next images, and favicon
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
