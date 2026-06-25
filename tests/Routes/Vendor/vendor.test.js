import vendorRoutes from '@/routes/Vendor/vendor.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const routeKey = (route) => `${route.method} ${route.path}`;

const missingMutatingSchemas = (routes) => routes
    .filter(route => MUTATING_METHODS.has(route.method) && !route.schema)
    .map(routeKey);

const invalidSchemas = (routes) => routes
    .filter(route => route.schema && typeof route.schema.safeParse !== 'function')
    .map(routeKey);

describe('Industry Standard: Vendor Routes Structure', () => {
    it('[Success] should export a non-empty array of routes', () => {
        expect(Array.isArray(vendorRoutes)).toBe(true);
        expect(vendorRoutes.length).toBeGreaterThan(0);
    });

    it('[Integrity] every route should have method, path, and handler', () => {
        vendorRoutes.forEach(route => {
            expect(route.method).toBeDefined();
            expect(route.path).toBeDefined();
            expect(typeof route.handler).toBe('function');
        });
    });

    it('[Integrity] all paths should start with /vendor', () => {
        vendorRoutes.forEach(route => {
            expect(route.path).toMatch(/^\/vendor/);
        });
    });

    it('[Security] all vendor routes should require auth middleware', () => {
        vendorRoutes.forEach(route => {
            expect(route.middleware).toBeDefined();
            expect(route.middleware).toContain('auth');
        });
    });

    it('[Security] all vendor routes should enforce vendor role', () => {
        vendorRoutes.forEach(route => {
            expect(route.roles).toBeDefined();
            expect(route.roles).toContain('vendor');
        });
    });

    it('[Integrity] should not have duplicate paths for same method', () => {
        const seen = new Set();
        const duplicates = [];
        vendorRoutes.forEach(route => {
            const key = `${route.method}:${route.path}`;
            if (seen.has(key)) duplicates.push(key);
            seen.add(key);
        });
        expect(duplicates).toEqual([]);
    });

    it('[Validation] all mutating vendor routes should define request schemas', () => {
        expect(missingMutatingSchemas(vendorRoutes)).toEqual([]);
    });

    it('[Validation] all vendor route schemas should be Zod-compatible', () => {
        expect(invalidSchemas(vendorRoutes)).toEqual([]);
    });
});
