import { generateToken, verifyToken } from '../../src/core/Helpers/jwt.js';
import { jest } from '@jest/globals';

describe('JWT Helper', () => {
    
    it('should generate a valid token and verify it', async () => {
        const payload = { id: 'u1', role: 'traveller' };
        const token = await generateToken(payload);
        expect(typeof token).toBe('string');

        const decoded = await verifyToken(token);
        expect(decoded.id).toBe('u1');
        expect(decoded.role).toBe('traveller');
    });

    it('should return null for invalid token', async () => {
        const result = await verifyToken('invalid.token.here');
        expect(result).toBeNull();
    });

    it('should return null for expired or tampered token', async () => {
        // We can't easily jump time here without a lib, 
        // but we can tamper with the string.
        const token = await generateToken({ id: 'u1' });
        const tampered = token.substring(0, token.length - 5) + 'abcde';
        const result = await verifyToken(tampered);
        expect(result).toBeNull();
    });
});
