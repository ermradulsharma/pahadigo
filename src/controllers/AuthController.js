const AuthService = require('../services/AuthService');
const OTPService = require('../services/OTPService');

class AuthController {

    // POST /auth/otp (Send OTP for Email or Phone)
    async sendOtp(req) {
        try {
            const body = req.jsonBody || await req.json();
            let { email, phone, role } = body;

            if (email) email = email.toLowerCase().trim();
            if (phone) phone = phone.trim();
            if (role) role = role.toLowerCase().trim();

            if (!email && !phone) {
                return { status: 400, data: { error: 'Email OR Phone is required' } };
            }

            // Basic regex for email validation if provided
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return { status: 400, data: { error: 'Invalid email format' } };
            }

            const identifier = email || phone;
            const otp = OTPService.generateOTP(identifier, role);

            // In production, this would be sent via SMS/Email service
            console.log(`[AUTH] OTP for ${identifier}: ${otp}`);

            return { status: 200, data: { message: 'OTP sent successfully', otp } };
        } catch (error) {
            console.error("Send OTP Error:", error);
            return { status: 500, data: { error: 'Failed to send OTP' } };
        }
    }

    // POST /auth/verify (Verify OTP and Login/Signup)
    async verifyOtp(req) {
        try {
            const body = req.jsonBody || await req.json();
            let { email, phone, otp } = body;

            if (email) email = email.toLowerCase().trim();
            if (phone) phone = phone.trim();

            const identifier = email || phone;

            if (!identifier || !otp) {
                return { status: 400, data: { error: 'Identifier (Email/Phone) and OTP required' } };
            }

            const result = await AuthService.verifyAndLogin({ identifier, otp, email, phone });

            return {
                status: 200,
                data: {
                    message: 'Login successful',
                    token: result.token,
                    role: result.role,
                    isNewUser: result.isNewUser
                }
            };
        } catch (error) {
            console.error("Verify OTP Error:", error);
            const status = error.message === 'Invalid or expired OTP' ? 400 : 500;
            return { status, data: { error: error.message } };
        }
    }

    // POST /auth/google
    async googleLogin(req) {
        try {
            const body = await req.json();
            const { idToken, role } = body;

            if (!idToken) return { status: 400, data: { error: 'Google ID Token required' } };

            const result = await AuthService.googleAuth(idToken, role);

            return { status: 200, data: { message: 'Google Login successful', token: result.token, isNewUser: result.isNewUser, user: result.user } };

        } catch (error) {
            console.error("Google Auth Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Google Token' } };
        }
    }
}

module.exports = new AuthController();
