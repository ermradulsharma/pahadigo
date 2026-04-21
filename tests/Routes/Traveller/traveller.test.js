import travellerRoutes from '@/routes/Traveller/traveller.js';

describe('Industry Standard: Traveller Routes Structure', () => {
    it('[Success] should export a non-empty array of routes', () => {
        expect(Array.isArray(travellerRoutes)).toBe(true);
        expect(travellerRoutes.length).toBeGreaterThan(0);
    });

    it('[Integrity] every route should have method, path, and handler', () => {
        travellerRoutes.forEach(route => {
            expect(route.method).toBeDefined();
            expect(route.path).toBeDefined();
            expect(typeof route.handler).toBe('function');
        });
    });

    it('[Integrity] all paths should start with /traveller', () => {
        travellerRoutes.forEach(route => {
            expect(route.path).toMatch(/^\/traveller/);
        });
    });

    it('[Security] all traveller routes should require auth middleware', () => {
        travellerRoutes.forEach(route => {
            expect(route.middleware).toBeDefined();
            expect(route.middleware).toContain('auth');
        });
    });

    it('[Security] all traveller routes should enforce traveller role', () => {
        travellerRoutes.forEach(route => {
            expect(route.roles).toBeDefined();
            expect(route.roles).toContain('traveller');
        });
    });
});
