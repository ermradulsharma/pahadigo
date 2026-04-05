import authMiddleware from '../../../src/core/Http/Middleware/auth.js';
import User from '../../../src/core/Models/User.js';
import jwt from 'jsonwebtoken';
import { cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { STATUS, RESPONSE_MESSAGES } from '../../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

describe('AuthMiddleware Test Suite', () => {
    let userId;

    beforeEach(async () => {
        await cleanDatabase();
        userId = generateId();
        jest.clearAllMocks();
    });

    it('should authorize valid bearer token', async () => {
        jest.spyOn(jwt, 'verify').mockReturnValue({ id: userId.toString() });
        await User.create({ _id: userId, status: STATUS.ACTIVE, role: 'traveller', identifier: 'c1' });

        const req = { 
            headers: { 
                get: (name) => name === 'authorization' ? 'Bearer valid-token' : null 
            } 
        };

        const result = await authMiddleware(req);
        expect(result.authorized).toBe(true);
        expect(result.user.id).toBe(userId.toString());
    });

    it('should block missing token', async () => {
        const req = { headers: { get: () => null } };
        const result = await authMiddleware(req);
        expect(result.authorized).toBe(false);
        expect(result.message).toBe(RESPONSE_MESSAGES.AUTH.NO_TOKEN);
    });

    it('should block invalid token', async () => {
        jest.spyOn(jwt, 'verify').mockImplementation(() => { throw new Error('Invalid'); });
        const req = { headers: { get: () => 'Bearer invalid' } };
        const result = await authMiddleware(req);
        expect(result.authorized).toBe(false);
        expect(result.message).toBe(RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
    });
});
