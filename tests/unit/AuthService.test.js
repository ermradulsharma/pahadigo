import AuthService from '../../src/core/Services/AuthService.js';
import OTPService from '../../src/core/Services/OTPService.js';
import User from '../../src/core/Models/User.js';
import { USER_STATUS, RESPONSE_MESSAGES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

// For ESM mocking, we use this pattern if possible or mock the imported object
import googleAuthLib from 'google-auth-library';
const { OAuth2Client } = googleAuthLib;

jest.mock('google-auth-library', () => ({
    OAuth2Client: jest.fn().mockImplementation(() => ({
        verifyIdToken: jest.fn()
    }))
}));



describe('AuthService', () => {
    describe('verifyAndLogin', () => {
        it('should throw an error for invalid OTP', async () => {
            await expect(AuthService.verifyAndLogin({
                identifier: 'test@example.com',
                otp: '123456',
                email: 'test@example.com'
            })).rejects.toThrow(RESPONSE_MESSAGES.AUTH.INVALID_OTP);
        });

        it('should create a new user and return a token for valid OTP', async () => {
            const email = 'newuser@example.com';
            const otp = OTPService.generateOTP(email, 'traveller');

            const result = await AuthService.verifyAndLogin({
                identifier: email,
                otp,
                email
            });

            expect(result.token).toBeDefined();
            expect(result.isNewUser).toBe(true);
            expect(result.role).toBe('traveller');

            const user = await User.findOne({ email });
            expect(user).toBeDefined();
            expect(user.isVerified).toBe(true);
        });

        it('should login existing user and check for role upgrade', async () => {
            const email = 'existing@example.com';
            await User.create({ email, role: 'traveller', isVerified: true });

            const otp = OTPService.generateOTP(email, 'vendor'); // Attempting to login as vendor
            const result = await AuthService.verifyAndLogin({
                identifier: email,
                otp,
                email
            });

            expect(result.isNewUser).toBe(false);
            expect(result.role).toBe('vendor');

            const updatedUser = await User.findOne({ email });
            expect(updatedUser.role).toBe('vendor');
        });
    });

    describe('Account Deactivation Flow', () => {
        it('should reject login for suspended accounts', async () => {
            const email = 'suspended@example.com';
            await User.create({ email, role: 'traveller', isVerified: true, status: USER_STATUS.SUSPENDED });

            const otp = OTPService.generateOTP(email, 'traveller');
            await expect(AuthService.verifyAndLogin({
                identifier: email,
                otp,
                email
            })).rejects.toThrow(RESPONSE_MESSAGES.AUTH.ACCOUNT_SUSPENDED);
        });
    });

    describe('Social Authentication', () => {
        it('should successfully authenticate with Google', async () => {
            const mockPayload = {
                email: 'google@example.com',
                name: 'Google User',
                sub: 'google_id_123'
            };

            const clientInstance = new OAuth2Client();
            clientInstance.verifyIdToken.mockResolvedValue({
                getPayload: () => mockPayload
            });

            process.env.GOOGLE_CLIENT_ID = 'test-client-id';
            const result = await AuthService.googleAuth('valid_token', 'user');

            expect(result.token).toBeDefined();
            expect(result.user.email).toBe('google@example.com');
            expect(result.user.googleId).toBe('google_id_123');
        });

        it('should throw config error for real token without client id', async () => {
            const oldId = process.env.GOOGLE_CLIENT_ID;
            delete process.env.GOOGLE_CLIENT_ID;
            await expect(AuthService.googleAuth('real_token', 'user')).rejects.toThrow(RESPONSE_MESSAGES.AUTH.CONFIG_MISSING);
            process.env.GOOGLE_CLIENT_ID = oldId;
        });
    });
});
