import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';

jest.unstable_mockModule('@/lib/appConfig', () => ({
    getAppConfig: jest.fn().mockResolvedValue({ jwt_secret: 'test_secret' })
}));

const { generateToken, verifyToken } = await import('@/helpers/jwt.js');

describe('Industry Standard: JWT Helper Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should generate a valid token', async () => {
        const payload = { id: '123' };
        const token = await generateToken(payload);
        
        expect(token).toBeDefined();
        const decoded = jwt.decode(token);
        expect(decoded.id).toBe('123');
    });

    it('[Success] should verify a valid token', async () => {
        const payload = { id: '123' };
        const token = jwt.sign(payload, 'test_secret');
        
        const result = await verifyToken(token);
        expect(result.id).toBe('123');
    });

    it('[Failure] should return null for invalid token', async () => {
        const result = await verifyToken('invalid-token');
        expect(result).toBeNull();
    });
});
