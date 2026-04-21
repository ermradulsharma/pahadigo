import adminRoutes from '@/routes/Admin/admin.js';

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
});
