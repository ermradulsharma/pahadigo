import Router from '@/routes/Router.js';

describe('Industry Standard: Router Grouping Logic', () => {
    it('[Success] should group routes with prefix and middleware', () => {
        const routes = [
            { path: '/login', method: 'POST', controller: 'Auth@login' },
            { path: '/register', method: 'POST', controller: 'Auth@register' }
        ];

        const grouped = Router.group({ prefix: '/auth', middleware: ['guest'] }, routes);

        expect(grouped).toHaveLength(2);
        expect(grouped[0].path).toBe('/auth/login');
        expect(grouped[0].middleware).toContain('guest');
    });

    it('[Success] should handle nested groups', () => {
        const routes = Router.group({ prefix: '/v1' }, [
            Router.group({ prefix: '/admin' }, [
                { path: '/users', method: 'GET' }
            ])
        ]);

        expect(routes[0].path).toBe('/v1/admin/users');
    });

    it('[Success] should expand multiple methods', () => {
        const routes = Router.group({}, [
            { path: '/test', method: ['GET', 'POST'] }
        ]);

        expect(routes).toHaveLength(2);
        expect(routes[0].method).toBe('GET');
        expect(routes[1].method).toBe('POST');
    });
});
