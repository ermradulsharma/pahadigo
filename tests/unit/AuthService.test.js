const AuthService = require('../../src/services/AuthService');
const OTPService = require('../../src/services/OTPService');
const User = require('../../src/models/User');

describe('AuthService', () => {
    describe('verifyAndLogin', () => {
        it('should throw an error for invalid OTP', async () => {
            await expect(AuthService.verifyAndLogin({
                identifier: 'test@example.com',
                otp: '123456',
                email: 'test@example.com'
            })).rejects.toThrow('Invalid or expired OTP');
        });

        it('should create a new user and return a token for valid OTP', async () => {
            const email = 'newuser@example.com';
            const otp = OTPService.generateOTP(email, 'user');

            const result = await AuthService.verifyAndLogin({
                identifier: email,
                otp,
                email
            });

            expect(result.token).toBeDefined();
            expect(result.isNewUser).toBe(true);
            expect(result.role).toBe('user');

            const user = await User.findOne({ email });
            expect(user).toBeDefined();
            expect(user.isVerified).toBe(true);
        });

        it('should login existing user and check for role upgrade', async () => {
            const email = 'existing@example.com';
            await User.create({ email, role: 'user', isVerified: true });

            const otp = OTPService.generateOTP(email, 'vendor'); // Attempting to login as vendor
            const result = await AuthService.verifyAndLogin({
                identifier: email,
                otp,
                email
            });

            expect(result.isNewUser).toBe(true); // role upgrade with missing profile makes them "new user" for vendor flow
            expect(result.role).toBe('vendor');

            const updatedUser = await User.findOne({ email });
            expect(updatedUser.role).toBe('vendor');
        });
    });
});
