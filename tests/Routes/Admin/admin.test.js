import adminRoutes from '@/routes/Admin/admin.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const routeKey = (route) => `${route.method} ${route.path}`;

const missingMutatingSchemas = (routes) => routes
    .filter(route => MUTATING_METHODS.has(route.method) && !route.schema)
    .map(routeKey);

const invalidSchemas = (routes) => routes
    .filter(route => route.schema && typeof route.schema.safeParse !== 'function')
    .map(routeKey);

describe('Industry Standard: Admin Routes Structure', () => {
    it('[Success] should export a non-empty array of routes', () => {
        expect(Array.isArray(adminRoutes)).toBe(true);
        expect(adminRoutes.length).toBeGreaterThan(0);
    });

    it('[Integrity] every route should have method, path, and handler', () => {
        adminRoutes.forEach((route, index) => {
            expect(route.method).toBeDefined(); // Route[index] missing method
            expect(route.path).toBeDefined();   // Route[index] missing path
            expect(typeof route.handler).toBe('function'); // handler must be function
        });
    });

    it('[Integrity] all paths should start with /admin', () => {
        adminRoutes.forEach(route => {
            expect(route.path).toMatch(/^\/admin/);
        });
    });

    it('[Security] all admin routes should require auth middleware', () => {
        adminRoutes.forEach(route => {
            expect(route.middleware).toBeDefined();
            expect(route.middleware).toContain('auth');
        });
    });

    it('[Security] all admin routes should enforce admin role', () => {
        adminRoutes.forEach(route => {
            expect(route.roles).toBeDefined();
            expect(route.roles).toContain('admin');
        });
    });

    it('[Validation] all mutating admin routes should define request schemas', () => {
        expect(missingMutatingSchemas(adminRoutes)).toEqual([]);
    });

    it('[Validation] all admin route schemas should be Zod-compatible', () => {
        expect(invalidSchemas(adminRoutes)).toEqual([]);
    });
});
