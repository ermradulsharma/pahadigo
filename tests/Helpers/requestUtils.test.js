import { getRequestMetadata } from '@/core/Helpers/requestUtils.js';

describe('RequestUtils Helper', () => {
    test('should extract metadata from Request object', () => {
        const req = {
            headers: {
                get: (name) => {
                    if (name === 'x-forwarded-for') return '1.2.3.4';
                    if (name === 'user-agent') return 'Mozilla/5.0';
                    return null;
                }
            }
        };
        const meta = getRequestMetadata(req);
        expect(meta.ipAddress).toBe('1.2.3.4');
        expect(meta.userAgent).toBe('Mozilla/5.0');
    });

    test('should extract metadata from plain object headers', () => {
        const req = {
            headers: {
                'x-real-ip': '5.6.7.8',
                'user-agent': 'Chrome'
            }
        };
        const meta = getRequestMetadata(req);
        expect(meta.ipAddress).toBe('5.6.7.8');
        expect(meta.userAgent).toBe('Chrome');
    });

    test('should return system for missing request', () => {
        const meta = getRequestMetadata(null);
        expect(meta.ipAddress).toBe('127.0.0.1');
    });

    test('should return unknown if headers are missing', () => {
        const meta = getRequestMetadata({});
        expect(meta.ipAddress).toBe('127.0.0.1');
    });
});
