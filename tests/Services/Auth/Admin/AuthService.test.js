import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {
        findOne: jest.fn(() => ({
            select: jest.fn().mockReturnThis()
        })),
        findById: jest.fn()
    }
}));



jest.unstable_mockModule('@/core/Services/Auth/BaseAuthService.js', () => ({
    default: {
        generateAndSaveTokens: jest.fn()
    }
}));

const { default: AuthService } = await import('@/services/Auth/Admin/AuthService.js');
const { default: User } = await import('@/models/User.js');
const { default: BaseAuthService } = await import('@/core/Services/Auth/BaseAuthService.js');

describe('Industry Standard: Admin AuthService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[authenticateWithPassword]', () => {
        it('[Success] should authenticate admin with correct password', async () => {
            const user = {
                _id: 'a1', role: 'admin', email: 'admin@test.com', password: 'hashed',
                comparePassword: jest.fn().mockResolvedValue(true),
                toObject: () => ({ email: 'admin@test.com' })
            };
            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(user)
            });
            BaseAuthService.generateAndSaveTokens.mockResolvedValue({
                accessToken: 'access-token',
                refreshToken: 'refresh-token'
            });

            const result = await AuthService.authenticateWithPassword({ email: 'admin@test.com', password: 'password' });

            expect(result.tokens.accessToken).toBe('access-token');
            expect(result.role).toBe('admin');
        });

        it('[Failure] should block non-admin from password login', async () => {
            const user = { role: 'traveller' };
            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(user)
            });

            await expect(AuthService.authenticateWithPassword({ email: 'user@test.com', password: 'password' }))
                .rejects.toThrow();
        });
    });

    describe('[resetPassword]', () => {
        it('[Success] should update password', async () => {
            const user = { save: jest.fn() };
            User.findById.mockResolvedValue(user);

            const result = await AuthService.resetPassword('a1', 'new-pass');

            expect(user.password).toBe('new-pass');
            expect(user.save).toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });
});
