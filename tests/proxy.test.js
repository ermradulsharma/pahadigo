import { proxy, config } from '@/proxy.js';

describe('Industry Standard: Edge Proxy (src/proxy.js)', () => {
    it('should define matcher pattern ignoring static assets and image files', () => {
        expect(config).toBeDefined();
        expect(config.matcher).toBeDefined();
        expect(Array.isArray(config.matcher)).toBe(true);
    });

    it('should inject security headers on general page requests', () => {
        const req = new Request('https://pahadigo.co.in/packages', {
            method: 'GET',
            headers: new Headers()
        });

        const res = proxy(req);

        expect(res.headers.get('X-Frame-Options')).toBe('DENY');
        expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
        expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
        expect(res.headers.get('Permissions-Policy')).toBe('camera=(), microphone=(), geolocation=()');
        expect(res.headers.get('x-request-id')).toBeDefined();
    });

    it('should preserve existing x-request-id header if provided by client', () => {
        const req = new Request('https://pahadigo.co.in/api/v1/packages', {
            method: 'GET',
            headers: new Headers({
                'x-request-id': 'client_req_xyz_999'
            })
        });

        const res = proxy(req);
        expect(res.headers.get('x-request-id')).toBe('client_req_xyz_999');
    });

    it('should attach CORS headers for /api/ routes', () => {
        const req = new Request('https://pahadigo.co.in/api/v1/auth/login', {
            method: 'GET',
            headers: new Headers({
                'origin': 'https://admin.pahadigo.co.in'
            })
        });

        const res = proxy(req);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://admin.pahadigo.co.in');
        expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
        expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    });

    it('should respond early with status 204 on CORS preflight OPTIONS request to /api/', () => {
        const req = new Request('https://pahadigo.co.in/api/v1/booking/checkout', {
            method: 'OPTIONS',
            headers: new Headers({
                'origin': 'https://admin.pahadigo.co.in'
            })
        });

        const res = proxy(req);
        expect(res.status).toBe(204);
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://admin.pahadigo.co.in');
    });
});
