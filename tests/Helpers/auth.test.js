import { transformAuthResponse } from '@/core/Helpers/auth.js';

describe('Auth Helper (Transformer)', () => {
    test('should transform nested user result with token', () => {
        const result = {
            user: { _id: 'u1', name: 'Test' },
            tokens: { accessToken: 'jwt-token' },
            role: 'vendor'
        };
        const transformed = transformAuthResponse(result);
        expect(transformed._id).toBe('u1');
        expect(transformed.tokens.accessToken).toBe('jwt-token');
        expect(transformed.role).toBe('vendor');
    });

    test('should handle Mongoose toObject conversion', () => {
        const result = {
            toObject: () => ({ _id: 'u1', name: 'Test' }),
            role: 'traveller'
        };
        const transformed = transformAuthResponse(result);
        expect(transformed._id).toBe('u1');
    });

    test('should include businessProfile if present', () => {
        const result = {
            user: { _id: 'u1' },
            businessProfile: { bizName: 'Biz' }
        };
        const transformed = transformAuthResponse(result);
        expect(transformed.businessProfile.bizName).toBe('Biz');
    });

    test('should return null for empty input', () => {
        expect(transformAuthResponse(null)).toBe(null);
    });
});
