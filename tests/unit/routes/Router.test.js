import Router from '../../../src/core/Routes/Router.js';

describe('Router Static Utility Test Suite', () => {
    it('should group routes with common prefix', () => {
        const routes = [
            { path: '/login', method: 'POST' },
            { path: '/verify', method: 'POST' }
        ];
        
        const grouped = Router.group({ prefix: '/api/auth' }, routes);
        
        expect(grouped[0].path).toBe('/api/auth/login');
        expect(grouped[1].path).toBe('/api/auth/verify');
    });

    it('should correctly merge middleware arrays', () => {
        const routes = [
            { path: '/profile', method: 'GET', middleware: ['m2'] }
        ];
        
        const grouped = Router.group({ prefix: '/user', middleware: ['m1'] }, routes);
        
        expect(grouped[0].middleware).toEqual(['m1', 'm2']);
    });

    it('should handle nested groups and flatten them', () => {
        const adminRoutes = [
            { path: '/users', method: 'GET' }
        ];
        const baseRoutes = Router.group({ prefix: '/admin' }, adminRoutes);
        const finalRoutes = Router.group({ prefix: '/api' }, baseRoutes);
        
        expect(finalRoutes[0].path).toBe('/api/admin/users');
        expect(finalRoutes.length).toBe(1);
    });
});
