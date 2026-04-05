import { getRequestMetadata } from '../../../src/core/Helpers/requestUtils.js';

describe('RequestUtils Helper Test Suite', () => {
    it('should extract IP and User-Agent from standard headers', () => {
        const req = {
            headers: {
                'x-forwarded-for': '1.2.3.4',
                'user-agent': 'Jest'
            }
        };
        const meta = getRequestMetadata(req);
        expect(meta.ipAddress).toBe('1.2.3.4');
        expect(meta.userAgent).toBe('Jest');
    });

    it('should handle Next.js Headers objects', () => {
        const headersMap = new Map([
            ['x-real-ip', '5.6.7.8'],
            ['user-agent', 'Mobile']
        ]);
        const req = {
            headers: { get: (name) => headersMap.get(name) }
        };
        const meta = getRequestMetadata(req);
        expect(meta.ipAddress).toBe('5.6.7.8');
        expect(meta.userAgent).toBe('Mobile');
    });
});
