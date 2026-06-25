import { jest } from '@jest/globals';

const mockDbConnect = jest.fn().mockResolvedValue(undefined);
const mockAuthMiddleware = jest.fn();
const mockRoleMiddleware = jest.fn();
const mockRateLimit = jest.fn(() => jest.fn().mockResolvedValue(null));
const mockValidate = jest.fn();
const mockProfileHandler = jest.fn();
const mockPackageCreateHandler = jest.fn();

jest.unstable_mockModule('@/core/Config/db.js', () => ({
    default: mockDbConnect
}));

jest.unstable_mockModule('@/core/Middleware/auth.js', () => ({
    default: mockAuthMiddleware
}));

jest.unstable_mockModule('@/core/Middleware/roleMiddleware.js', () => ({
    default: mockRoleMiddleware
}));

jest.unstable_mockModule('@/core/Middleware/rateLimit.js', () => ({
    rateLimit: mockRateLimit
}));

jest.unstable_mockModule('@/core/Helpers/validation.js', () => ({
    validate: mockValidate
}));

jest.unstable_mockModule('@/core/Routes/api.js', () => ({
    default: [
        {
            method: 'GET',
            path: '/traveller/profile',
            middleware: ['auth'],
            roles: ['traveller'],
            handler: mockProfileHandler
        },
        {
            method: 'POST',
            path: '/vendor/package',
            schema: { kind: 'package-create-schema' },
            handler: mockPackageCreateHandler
        }
    ]
}));

const { GET, POST } = await import('@/app/api/[...slug]/route.js');

const buildRequest = (url, options = {}) => new Request(url, {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body
});

describe('Catch-all API route integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAuthMiddleware.mockResolvedValue({ authorized: true, user: { id: 'u1', role: 'traveller' } });
        mockRoleMiddleware.mockReturnValue({ authorized: true });
        mockValidate.mockReturnValue({ success: true, data: { name: 'Everest Trek' } });
        mockProfileHandler.mockImplementation(async (req, { params }) => Response.json({
            success: true,
            data: {
                userId: req.user.id,
                params,
                requestId: req.requestId
            }
        }));
        mockPackageCreateHandler.mockImplementation(async (req, { params }) => Response.json({
            success: true,
            data: {
                payload: req.validData,
                params,
                body: req.payload
            }
        }));
    });

    it('[Success] should dispatch protected routes with auth and role context', async () => {
        const request = buildRequest('http://localhost/api/traveller/profile', {
            headers: { authorization: 'Bearer token' }
        });

        const response = await GET(request, { params: Promise.resolve({ slug: ['traveller', 'profile'] }) });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.userId).toBe('u1');
        expect(body.data.params).toEqual({});
        expect(mockDbConnect).toHaveBeenCalledTimes(1);
        expect(mockAuthMiddleware).toHaveBeenCalledTimes(1);
        expect(mockRoleMiddleware).toHaveBeenCalledWith({ user: { id: 'u1', role: 'traveller' } }, ['traveller']);
        expect(mockProfileHandler).toHaveBeenCalledTimes(1);
    });

    it('[Success] should validate request bodies before invoking the handler', async () => {
        const request = buildRequest('http://localhost/api/vendor/package', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'Everest Trek' })
        });

        const response = await POST(request, { params: Promise.resolve({ slug: ['vendor', 'package'] }) });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(mockValidate).toHaveBeenCalledWith({ kind: 'package-create-schema' }, { name: 'Everest Trek' });
        expect(body.data.payload).toEqual({ name: 'Everest Trek' });
        expect(body.data.body).toEqual({ name: 'Everest Trek' });
        expect(mockPackageCreateHandler).toHaveBeenCalledTimes(1);
    });

    it('[Failure] should return not found for unknown routes', async () => {
        const request = buildRequest('http://localhost/api/unknown/path', {
            headers: { authorization: 'Bearer token' }
        });

        const response = await GET(request, { params: Promise.resolve({ slug: ['unknown', 'path'] }) });
        const body = await response.json();

        expect(response.status).toBe(404);
        expect(body.success).toBe(false);
        expect(mockProfileHandler).not.toHaveBeenCalled();
        expect(mockPackageCreateHandler).not.toHaveBeenCalled();
    });
});
