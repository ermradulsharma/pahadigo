import routes from '@/routes/api.js';

describe('Industry Standard: API Route Definitions', () => {
    it('[Integrity] should contain routes from all main modules', () => {
        expect(Array.isArray(routes)).toBe(true);
        expect(routes.length).toBeGreaterThan(0);
        
        // Check for some common paths that should exist
        const paths = routes.map(r => r.path);
        // Auth routes
        expect(paths.some(p => p.includes('/auth'))).toBe(true);
        // Admin routes
        expect(paths.some(p => p.includes('/admin'))).toBe(true);
        // Public routes (like /packages or /categories)
        expect(paths.some(p => p.includes('/packages') || p.includes('/categories'))).toBe(true);
    });
});
