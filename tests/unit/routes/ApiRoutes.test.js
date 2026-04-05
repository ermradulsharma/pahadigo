import routes from '../../../src/core/Routes/api.js';
import { USER_ROLES } from '../../../src/core/Constants/index.js';

describe('API Route Configuration', () => {
    
    it('should have all handlers defined as functions', () => {
        routes.forEach(route => {
            expect(typeof route.handler).toBe('function');
            expect(route.path).toBeDefined();
            expect(route.method).toBeDefined();
        });
    });

    it('should enforce admin roles on all /admin prefixed routes', () => {
        const adminRoutes = routes.filter(r => r.path.startsWith('/admin'));
        adminRoutes.forEach(route => {
            // Some routes might be nested or have multiple roles, but for /admin group it should include admin
            expect(route.roles).toContain(USER_ROLES.ADMIN);
            expect(route.middleware).toContain('auth');
        });
    });

    it('should enforce traveller roles on all /traveller (protected) routes', () => {
        // Note: Some /traveller routes are PUBLIC (policies), so we filter those that have middleware
        const protectedTravellerRoutes = routes.filter(r => r.path.startsWith('/traveller') && r.middleware?.includes('auth'));
        protectedTravellerRoutes.forEach(route => {
             // become-vendor is special, it's for travellers to become vendors
             if (route.path === '/traveller/become-vendor') {
                 expect(route.roles).toContain(USER_ROLES.TRAVELLER);
             } else {
                 expect(route.roles).toContain(USER_ROLES.TRAVELLER);
             }
        });
    });

    it('should ensure /auth/login is public', () => {
        const loginRoute = routes.find(r => r.path === '/auth/login' && r.method === 'POST');
        expect(loginRoute).toBeDefined();
        expect(loginRoute.middleware).toBeUndefined();
    });

    it('should ensure sensitive auth routes are protected', () => {
        const protectedAuth = ['/auth/me', '/auth/logout', '/auth/update-profile'];
        protectedAuth.forEach(path => {
            const route = routes.find(r => r.path === path);
            expect(route).toBeDefined();
            expect(route.middleware).toContain('auth');
        });
    });

    it('should catch common path typos (e.g. double slashes)', () => {
        routes.forEach(route => {
            expect(route.path).not.toMatch(/\/\//);
        });
    });

    it('should have unique path-method combinations', () => {
        const combinations = new Set();
        routes.forEach(route => {
            // Some routes might have multiple methods if manually defined, 
            // but the Router doesn't explicitly prevent it unless we check.
            const key = `${route.method}:${route.path}`;
            // We allow same path with different methods, but same path+method should be unique
            expect(combinations.has(key)).toBe(false);
            combinations.add(key);
        });
    });
});
