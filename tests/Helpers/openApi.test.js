import routes from '@/routes/api.js';
import { generateOpenApiSpec } from '@/core/Helpers/openApi.js';

const mutatingMethods = new Set(['post', 'put', 'patch', 'delete']);
const toOpenApiPath = (path) => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

describe('OpenAPI specification generation', () => {
    it('[Success] generates a valid OpenAPI baseline document', () => {
        const spec = generateOpenApiSpec(routes);

        expect(spec.openapi).toBe('3.0.3');
        expect(spec.info.title).toBe('PahadiGo API');
        expect(spec.servers).toEqual([{ url: '/api', description: 'Next.js API base path' }]);
        expect(spec.components.securitySchemes.bearerAuth).toMatchObject({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
        });
        expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
    });

    it('[Integrity] documents every route and method from the route manifest', () => {
        const spec = generateOpenApiSpec(routes);
        const missingRoutes = routes.filter((route) => {
            const path = toOpenApiPath(route.path);
            const method = route.method.toLowerCase();
            return !spec.paths[path]?.[method];
        }).map(route => `${route.method} ${route.path}`);

        expect(missingRoutes).toEqual([]);
    });

    it('[Validation] documents request bodies for schema-backed mutating routes', () => {
        const spec = generateOpenApiSpec(routes);
        const missingRequestBodies = routes.filter((route) => {
            const method = route.method.toLowerCase();
            if (!route.schema || !mutatingMethods.has(method)) return false;
            return !spec.paths[toOpenApiPath(route.path)]?.[method]?.requestBody;
        }).map(route => `${route.method} ${route.path}`);

        expect(missingRequestBodies).toEqual([]);
    });

    it('[Security] documents bearer auth for protected routes', () => {
        const spec = generateOpenApiSpec(routes);
        const missingSecurity = routes.filter((route) => {
            if (!route.middleware?.includes('auth')) return false;
            return !spec.paths[toOpenApiPath(route.path)]?.[route.method.toLowerCase()]?.security;
        }).map(route => `${route.method} ${route.path}`);

        expect(missingSecurity).toEqual([]);
    });
});
