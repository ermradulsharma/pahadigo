import { jest } from '@jest/globals';

const mockGetRequestMetadata = jest.fn();

jest.unstable_mockModule('@/core/Helpers/requestUtils.js', () => ({
    getRequestMetadata: mockGetRequestMetadata
}));

const { default: requestContextMiddleware } = await import('@/core/Http/Middleware/requestContext.js');

describe('Industry Standard: requestContextMiddleware', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should extract metadata and augment extensible request object', () => {
        const dummyMetadata = {
            ipAddress: '203.0.113.195',
            realIp: '203.0.113.195',
            device: {
                summary: 'Android Mobile',
                isMobile: true,
                platform: 'Android'
            },
            location: {
                summary: 'Dehradun, India',
                city: 'Dehradun',
                country: 'India'
            }
        };

        mockGetRequestMetadata.mockReturnValue(dummyMetadata);

        const req = {
            headers: new Headers({ 'x-forwarded-for': '203.0.113.195' })
        };

        const result = requestContextMiddleware(req);

        expect(mockGetRequestMetadata).toHaveBeenCalledWith(req);
        expect(req.context).toBe(dummyMetadata);
        expect(req.clientIp).toBe('203.0.113.195');
        expect(req.realIp).toBe('203.0.113.195');
        expect(req.deviceInfo).toBe(dummyMetadata.device);
        expect(req.locationInfo).toBe(dummyMetadata.location);

        expect(result.ip).toBe('203.0.113.195');
        expect(result.device).toBe('Android Mobile');
        expect(result.location).toBe('Dehradun, India');
    });

    it('should return context metadata safely even if req is not extensible or null', () => {
        const dummyMetadata = {
            ipAddress: '127.0.0.1',
            realIp: '127.0.0.1',
            device: { summary: 'Desktop' },
            location: { summary: 'Localhost' }
        };
        mockGetRequestMetadata.mockReturnValue(dummyMetadata);

        const result = requestContextMiddleware(null);
        expect(result.ip).toBe('127.0.0.1');
        expect(result.device).toBe('Desktop');
    });
});
