import { transformAuthResponse } from '@/core/Helpers/auth.js';

describe('Auth Helper (Transformer)', () => {
    test('should transform nested user result with token', () => {
        const result = {
            user: {
                _id: 'u1',
                role: 'vendor'
            },
            token: 'jwt-token'
        };
        const transformed = transformAuthResponse(result);
        expect(transformed.user._id).toBe('u1');
        expect(transformed.token).toBe('jwt-token');
        expect(transformed.user.role).toBe('vendor');
    });

    test('should handle Mongoose toObject conversion', () => {
        const result = {
            user: {
                _id: 'u1',
                toObject: () => ({ _id: 'u1', role: 'vendor' })
            },
            token: 'jwt-token'
        };
        const transformed = transformAuthResponse(result);
        expect(transformed.user._id).toBe('u1');
    });

    test('should include businessProfile if present', () => {
        const result = {
            user: { _id: 'u1' },
            businessProfile: { _id: 'b1' }
        };
        const transformed = transformAuthResponse(result);
        expect(transformed.businessProfile._id).toBe('b1');
    });
});
