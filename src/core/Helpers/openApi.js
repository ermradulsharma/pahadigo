import routes from '@/core/Routes/api.js';

const OPENAPI_VERSION = '3.0.3';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const normalizeRouteMethod = (method) => String(method).toLowerCase();

const toOpenApiPath = (path) => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

const toTitle = (value) => value
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

const extractPathParameters = (path) => {
    const matches = [...path.matchAll(/:([A-Za-z0-9_]+)/g)];
    return matches.map(([, name]) => ({
        name,
        in: 'path',
        required: true,
        schema: { type: 'string' }
    }));
};

const inferTag = (path) => {
    const [segment = 'api'] = path.split('/').filter(Boolean);
    return toTitle(segment);
};

const buildOperationId = (method, path) => {
    const pathKey = path
        .split('/')
        .filter(Boolean)
        .map(segment => segment.startsWith(':') ? `by-${segment.slice(1)}` : segment)
        .join('-') || 'root';

    return `${normalizeRouteMethod(method)}-${pathKey}`.replace(/[^A-Za-z0-9]+(.)/g, (_, char) => char.toUpperCase());
};

const buildRequestBody = (route) => {
    if (!route.schema || !MUTATING_METHODS.has(route.method)) return undefined;

    return {
        required: !['DELETE'].includes(route.method),
        content: {
            'application/json': {
                schema: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Validated by the route Zod schema.'
                }
            },
            'multipart/form-data': {
                schema: {
                    type: 'object',
                    additionalProperties: true,
                    description: 'Validated by the route Zod schema after form-data parsing.'
                }
            }
        }
    };
};

const buildSecurity = (route) => {
    if (!route.middleware?.includes('auth')) return undefined;
    return [{ bearerAuth: [] }];
};

const buildResponses = () => ({
    200: {
        description: 'Successful response'
    },
    400: {
        description: 'Validation or bad request error'
    },
    401: {
        description: 'Authentication required'
    },
    403: {
        description: 'Insufficient role permissions'
    },
    404: {
        description: 'Resource not found'
    },
    500: {
        description: 'Unexpected server error'
    }
});

export const generateOpenApiSpec = (routeDefinitions = routes) => {
    const paths = {};
    const tags = new Set();

    routeDefinitions.forEach((route) => {
        const method = normalizeRouteMethod(route.method);
        const openApiPath = toOpenApiPath(route.path);
        const tag = inferTag(route.path);
        tags.add(tag);

        paths[openApiPath] = paths[openApiPath] || {};
        paths[openApiPath][method] = {
            tags: [tag],
            operationId: buildOperationId(route.method, route.path),
            summary: `${route.method} ${route.path}`,
            parameters: extractPathParameters(route.path),
            responses: buildResponses()
        };

        const requestBody = buildRequestBody(route);
        if (requestBody) {
            paths[openApiPath][method].requestBody = requestBody;
        }

        const security = buildSecurity(route);
        if (security) {
            paths[openApiPath][method].security = security;
        }

        if (route.roles?.length) {
            paths[openApiPath][method]['x-roles'] = route.roles;
        }

        if (route.middleware?.length) {
            paths[openApiPath][method]['x-middleware'] = route.middleware;
        }
    });

    return {
        openapi: OPENAPI_VERSION,
        info: {
            title: 'PahadiGo API',
            version: '2.6.0',
            description: 'Generated baseline OpenAPI specification from the modular route manifest.'
        },
        servers: [
            { url: '/api', description: 'Next.js API base path' }
        ],
        tags: [...tags].sort().map(name => ({ name })),
        paths,
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    };
};

export default generateOpenApiSpec;
