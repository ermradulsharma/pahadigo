import authRoutes from '@/routes/Auth/auth.js';

describe('Industry Standard: Auth Routes Structure', () => {
    it('[Success] should export a non-empty array of routes', () => {
        expect(Array.isArray(authRoutes)).toBe(true);
        expect(authRoutes.length).toBeGreaterThan(0);
    });

    it('[Integrity] every route should have method, path, and handler', () => {
        authRoutes.forEach(route => {
            expect(route.method).toBeDefined();
            expect(route.path).toBeDefined();
            expect(typeof route.handler).toBe('function');
        });
    });

    it('[Integrity] all paths should start with /auth', () => {
        authRoutes.forEach(route => {
            expect(route.path).toMatch(/^\/auth/);
        });
    });

    it('[Security] authenticated auth routes should have auth middleware', () => {
        const protectedPaths = ['/auth/me', '/auth/logout', '/auth/update-profile', '/auth/delete-profile'];
        const protectedRoutes = authRoutes.filter(r => protectedPaths.includes(r.path));
        protectedRoutes.forEach(route => {
            expect(route.middleware).toBeDefined();
            expect(route.middleware).toContain('auth');
        });
    });

    it('[Security] public auth routes should NOT require auth middleware', () => {
        const publicPaths = ['/auth/login', '/auth/otp', '/auth/google', '/auth/facebook'];
        const publicRoutes = authRoutes.filter(r => publicPaths.includes(r.path));
        publicRoutes.forEach(route => {
            const hasAuth = route.middleware && route.middleware.includes('auth');
            expect(hasAuth).toBeFalsy();
        });
    });
});
