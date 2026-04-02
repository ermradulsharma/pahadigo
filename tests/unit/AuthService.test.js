import AuthService from '../../src/core/Services/AuthService.js';
import OTPService from '../../src/core/Services/OTPService.js';
import User from '../../src/core/Models/User.js';
import { USER_STATUS, RESPONSE_MESSAGES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

// For ESM mocking
import googleAuthLib from 'google-auth-library';
const { OAuth2Client } = googleAuthLib;

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
            const otp = await OTPService.generateOTP(email, 'traveller');

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

            const otp = await OTPService.generateOTP(email, 'vendor'); // Attempting to login as vendor
            const result = await AuthService.verifyAndLogin({
                identifier: email,
                otp,
                email
            });

            expect(result.isNewUser).toBeDefined();
            expect(result.role).toBe('vendor');

            const updatedUser = await User.findOne({ email });
            expect(updatedUser).toBeDefined();
            expect(updatedUser.role).toBe('vendor');
        });
    });

    describe('Account Deactivation Flow', () => {
        it('should reject login for suspended accounts', async () => {
            const email = 'suspended@example.com';
            await User.create({ email, role: 'traveller', isVerified: true, status: USER_STATUS.SUSPENDED });

            const otp = await OTPService.generateOTP(email, 'traveller');
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

            jest.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
                getPayload: () => mockPayload
            });

            process.env.GOOGLE_CLIENT_ID = 'test-client-id';
            const result = await AuthService.googleAuth('valid_token', 'traveller');

            expect(result.token).toBeDefined();
            expect(result.user.email).toBe('google@example.com');
            expect(result.user.googleId).toBe('google_id_123');
        });

        it('should throw config error for real token without client id', async () => {
            const oldId = process.env.GOOGLE_CLIENT_ID;
            delete process.env.GOOGLE_CLIENT_ID;
            await expect(AuthService.googleAuth('real_token', 'traveller')).rejects.toThrow(RESPONSE_MESSAGES.AUTH.CONFIG_MISSING);
            process.env.GOOGLE_CLIENT_ID = oldId;
        });
    });

    describe('Password Authentication', () => {
        it('should login admin with valid password', async () => {
            const email = 'admin@example.com';
            const user = await User.create({ email, role: 'admin', isVerified: true });
            user.password = 'StrongPass123!';
            await user.save();
            
            const result = await AuthService.loginWithPassword({ email, password: 'StrongPass123!' });
            expect(result.token).toBeDefined();
            expect(result.role).toBe('admin');
        });

        it('should reject non-admin users for password login', async () => {
            const email = 'user_pass@example.com';
            const user = await User.create({ email, role: 'traveller', isVerified: true, password: 'StrongPass123!' });

            await expect(AuthService.loginWithPassword({ email, password: 'StrongPass123!' })).rejects.toThrow(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
        });

        it('should reject invalid password', async () => {
            const email = 'admin_bad@example.com';
            const user = await User.create({ email, role: 'admin', isVerified: true, password: 'StrongPass123!' });

            await expect(AuthService.loginWithPassword({ email, password: 'WrongPassword' })).rejects.toThrow(RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        });
    });

    describe('Profile Management', () => {
        it('should fetch profile by id', async () => {
            const email = 'profile@example.com';
            const user = await User.create({ email, role: 'traveller', isVerified: true });

            const profile = await AuthService.getProfileById(user._id);
            expect(profile).toBeDefined();
            expect(profile.email).toBe(email);
        });

        it('should delete a profile (cascade deletion logic)', async () => {
            const email = 'delete@example.com';
            const user = await User.create({ email, role: 'traveller', isVerified: true });

            await AuthService.deleteProfile(email);
            const foundUser = await User.findOne({ email });
            expect(foundUser).toBeNull();
        });

        it('should soft delete profile by id', async () => {
             const email = 'softdelete@example.com';
             const user = await User.create({ email, role: 'traveller', isVerified: true });

             const success = await AuthService.deleteProfileById(user._id, 'User request');
             expect(success).toBe(true);
             const softDeleted = await User.findById(user._id);
             expect(softDeleted.deletedAt).toBeDefined();
             expect(softDeleted.status).toBe(USER_STATUS.DELETED);
        });
    });

    describe('Password Reset', () => {
        it('should trigger forget password email', async () => {
            const email = 'reset@example.com';
            await User.create({ email, role: 'admin', isVerified: true });

            const result = await AuthService.forgetPassword(email);
            expect(result.message).toBe(RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_LINK_SENT);
        });

        it('should successfully reset password', async () => {
            const email = 'newpass@example.com';
            const user = await User.create({ email, role: 'admin', isVerified: true, password: 'OldPass' });

            const success = await AuthService.resetPassword(user._id, 'NewPass123');
            expect(success).toBe(true);

            const updated = await User.findOne({ email }).select('+password');
            const isMatch = await updated.comparePassword('NewPass123');
            expect(isMatch).toBe(true);
        });
    });

    describe('Missing Coverage & Edge Cases', () => {
        it('should return profileCompleted if vendor has aadhar and pan', async () => {
            const email = 'vendordocs@example.com';
            const user = await User.create({ email, role: 'vendor', isVerified: true });
            
            // Mock Vendor
            const Vendor = (await import('../../src/core/Models/Vendor.js')).default;
            await Vendor.create({
                user: user._id,
                businessName: 'My Stay',
                documents: {
                    aadharCard: [{ url: 'aadhar.png', status: 'verified' }],
                    panCard: { url: 'pan.png', status: 'verified' }
                }
            });

            const profile = await AuthService.getProfileById(user._id);
            expect(profile.businessProfileStatus).toBe('profileCompleted');
        });

        it('should reactive a self-deleted account on login', async () => {
             const email = 'selfdeleted@example.com';
             const user = await User.create({ 
                 email, role: 'traveller', isVerified: true, 
                 status: USER_STATUS.DELETED
             });
             user.deletedAt = new Date();
             user.deletedBy = user._id;
             await user.save();

             const otp = await OTPService.generateOTP(email, 'traveller');
             const result = await AuthService.verifyAndLogin({ identifier: email, otp });
             expect(result.token).toBeDefined();

             const restored = await User.findById(user._id);
             expect(restored.status).toBe(USER_STATUS.ACTIVE);
             expect(restored.deletedAt).toBeNull();
        });

        it('should handle verifyAndLogin with master role to targetRole', async () => {
            const email = 'master_otp@example.com';
            const identifier = 'master_otp@example.com';
            const otp = await OTPService.generateOTP(email, 'master', { termsAccepted: true });
            const result = await AuthService.verifyAndLogin({ identifier, otp, targetRole: 'vendor' });
            expect(result.role).toBe('vendor');
            expect(result.user.termsAccepted).toBe(true);
        });

        it('should reject OTP login for Admin', async () => {
             const email = 'admin_otp@example.com';
             await User.create({ email, role: 'admin', isVerified: true });
             const otp = await OTPService.generateOTP(email, 'admin');
             await expect(AuthService.verifyAndLogin({ identifier: email, otp })).rejects.toThrow(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
        });

        it('should handle facebookAuth success', async () => {
             global.fetch = jest.fn().mockResolvedValue({
                 json: async () => ({ id: 'fb123', name: 'FB User', email: 'fb@fb.com' })
             });
             const result = await AuthService.facebookAuth('fake_token', 'traveller');
             expect(result.token).toBeDefined();
             expect(result.user.facebookId).toBe('fb123');
        });

        it('should handle appleAuth success', async () => {
             const jwtHelper = await import('jsonwebtoken');
             const jwt = jwtHelper.default || jwtHelper;
             jest.spyOn(jwt, 'decode').mockReturnValue({ sub: 'app123', email: 'apple@example.com' });
             const result = await AuthService.appleAuth('fake_id_token', 'traveller');
             expect(result.token).toBeDefined();
             expect(result.user.appleId).toBe('app123');
        });
        
        it('should verify token and return user', async () => {
             const jwtHelper = await import('../../src/core/Helpers/jwt.js');
             const email = 'verify@example.com';
             const user = await User.create({ email, role: 'traveller', isVerified: true });
             const token = jwtHelper.generateToken({ id: user._id, role: user.role });
             
             const result = await AuthService.verify(token);
             expect(result.user._id.toString()).toBe(user._id.toString());
        });

        it('should change password successfully', async () => {
             const email = 'changepw@example.com';
             const user = await User.create({ email, role: 'admin', isVerified: true });
             await AuthService.changePassword(user._id, 'NewSecret123!');
             const updated = await User.findOne({ email }).select('+password');
             const isMatch = await updated.comparePassword('NewSecret123!');
             expect(isMatch).toBe(true);
        });

        it('should updateProfile using email', async () => {
             const email = 'updateme@example.com';
             await User.create({ email, name: 'Old Name', role: 'traveller', isVerified: true });
             const updated = await AuthService.updateProfile(email, { name: 'New Name' });
             expect(updated.name).toBe('New Name');
        });
    });
});
