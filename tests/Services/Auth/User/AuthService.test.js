import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

jest.unstable_mockModule('@/models/User.js', () => ({
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn()
    }
}));

jest.unstable_mockModule('@/models/Vendor.js', () => ({
    default: { findOne: jest.fn() }
}));

jest.unstable_mockModule('@/services/Auth/User/OTPService.js', () => ({
    default: {
        generateOTP: jest.fn(),
        verifyOTP: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Auth/BaseAuthService.js', () => ({
    default: {
        generateAndSaveTokens: jest.fn()
    }
}));



let mockConfig = {
    facebook: { app_id: '12345' },
    apple: { client_id: 'com.test.app' }
};

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockImplementation(() => Promise.resolve(mockConfig))
}));

const { default: AuthService } = await import('@/services/Auth/User/AuthService.js');
const { default: User } = await import('@/models/User.js');
const { default: Vendor } = await import('@/models/Vendor.js');
const { default: OTPService } = await import('@/services/Auth/User/OTPService.js');
const { default: BaseAuthService } = await import('@/core/Services/Auth/BaseAuthService.js');

describe('Industry Standard: User AuthService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[initiateOTP]', () => {
        it('[Success] should initiate OTP for valid user', async () => {
            User.findOne.mockResolvedValue(null);
            OTPService.generateOTP.mockResolvedValue({ success: true });

            const result = await AuthService.initiateOTP({ identifier: 'test@test.com' });
            
            expect(OTPService.generateOTP).toHaveBeenCalledWith('test@test.com', undefined, { termsAccepted: undefined });
            expect(result.success).toBe(true);
        });

        it('[Failure] should block admin from OTP login', async () => {
            User.findOne.mockResolvedValue({ role: 'admin' });
            await expect(AuthService.initiateOTP({ identifier: 'admin@test.com' }))
                .rejects.toThrow();
        });
    });

    describe('[authenticateWithOTP]', () => {
        it('[Success] should authenticate existing user and return token', async () => {
            const identifier = '9876543210';
            OTPService.verifyOTP.mockResolvedValue({ termsAccepted: 'true' });
            User.findOne.mockResolvedValue({ _id: 'u1', role: 'traveller', preferences: {}, isModified: () => false });
            BaseAuthService.generateAndSaveTokens.mockResolvedValue({ accessToken: 'mock-token' });

            const result = await AuthService.authenticateWithOTP({ identifier, otp: '123456' });

            expect(result.tokens.accessToken).toBe('mock-token');
            expect(result.role).toBe('traveller');
        });

        it('[Success] should create new user if not exists', async () => {
            const identifier = 'new@test.com';
            OTPService.verifyOTP.mockResolvedValue({ role: 'traveller' });
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({ _id: 'unew', role: 'traveller', email: identifier });
            BaseAuthService.generateAndSaveTokens.mockResolvedValue({ accessToken: 'new-token' });

            const result = await AuthService.authenticateWithOTP({ identifier, otp: '123456' });

            expect(User.create).toHaveBeenCalled();
            expect(result.isNewUser).toBe(true);
        });
    });

    describe('[toggleRole]', () => {
        it('[Success] should switch role and return new status', async () => {
            const user = { _id: 'u1', role: 'traveller', save: jest.fn(), toObject: () => ({ role: 'traveller' }) };
            User.findById.mockResolvedValue(user);
            Vendor.findOne.mockResolvedValue(null);

            const result = await AuthService.toggleRole('u1');

            expect(user.role).toBe('vendor');
            expect(user.save).toHaveBeenCalled();
            expect(result.role).toBe('vendor');
        });
    });

    describe('[authenticateWithFacebook]', () => {
        beforeEach(() => {
            mockConfig.facebook.app_id = '12345';
        });

        it('[Success] should authenticate Facebook user', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ id: 'fb123', name: 'FB User', email: 'fb@test.com' })
            });

            User.findOne.mockResolvedValue({
                _id: 'u1',
                role: 'traveller',
                isModified: () => false
            });
            BaseAuthService.generateAndSaveTokens.mockResolvedValue({ accessToken: 'mock-token' });

            const result = await AuthService.authenticateWithFacebook('mock-access-token', 'traveller');
            expect(result.tokens.accessToken).toBe('mock-token');
            expect(result.role).toBe('traveller');
        });

        it('[Failure] should throw error on invalid token response', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false
            });

            await expect(AuthService.authenticateWithFacebook('invalid-token'))
                .rejects.toThrow();
        });

        it('[Failure] should throw error when configuration is missing', async () => {
            mockConfig.facebook.app_id = null;
            await expect(AuthService.authenticateWithFacebook('some-token'))
                .rejects.toThrow();
        });
    });

    describe('[authenticateWithApple]', () => {
        beforeEach(() => {
            mockConfig.apple.client_id = 'com.test.app';
        });

        it('[Success] should authenticate Apple user', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    keys: [{ kid: 'key-1', kty: 'RSA', n: 'mock-n', e: 'mock-e' }]
                })
            });

            // Mock jwt.decode and jwt.verify
            jest.spyOn(jwt, 'decode').mockReturnValue({ header: { kid: 'key-1' } });
            jest.spyOn(jwt, 'verify').mockReturnValue({ sub: 'apple123', email: 'apple@test.com' });

            // Mock crypto.createPublicKey
            jest.spyOn(crypto, 'createPublicKey').mockReturnValue({});

            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({
                _id: 'u2',
                role: 'traveller',
                email: 'apple@test.com',
                appleId: 'apple123'
            });
            BaseAuthService.generateAndSaveTokens.mockResolvedValue({ accessToken: 'mock-token' });

            const result = await AuthService.authenticateWithApple('mock-id-token', 'traveller', { name: { firstName: 'Apple', lastName: 'User' } });
            expect(result.tokens.accessToken).toBe('mock-token');
            expect(User.create).toHaveBeenCalled();
        });

        it('[Failure] should throw error when token signature is invalid', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    keys: [{ kid: 'key-1', kty: 'RSA', n: 'mock-n', e: 'mock-e' }]
                })
            });

            jest.spyOn(jwt, 'decode').mockReturnValue({ header: { kid: 'key-1' } });
            jest.spyOn(jwt, 'verify').mockImplementation(() => {
                throw new Error('Invalid signature');
            });
            jest.spyOn(crypto, 'createPublicKey').mockReturnValue({});

            await expect(AuthService.authenticateWithApple('invalid-id-token'))
                .rejects.toThrow();
        });

        it('[Failure] should throw error when configuration is missing', async () => {
            mockConfig.apple.client_id = null;
            await expect(AuthService.authenticateWithApple('mock-id-token'))
                .rejects.toThrow();
        });
    });
});
