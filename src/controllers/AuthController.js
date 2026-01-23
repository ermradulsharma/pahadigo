const AuthService = require('../services/AuthService');
const OTPService = require('../services/OTPService');

class AuthController {

    // POST /auth/otp (Send OTP for Email or Phone)
    async sendOtp(req) {
        try {
            let body = req.jsonBody;

            // If body wasn't parsed by middleware, try to parse it safely
            if (!body) {
                try {
                    body = await req.json();
                } catch (e) {
                    console.error("AuthController: Error parsing req.json():", e);
                    return { status: 400, data: { error: 'Invalid or missing JSON body' } };
                }
            }

            console.log("[AUTH] sendOtp body:", JSON.stringify(body));
            let { email, phone, role } = body;
            if (email) email = email.toLowerCase().trim();
            if (phone) phone = phone.trim();
            if (role) role = role.toLowerCase().trim();
            if (!email && !phone) {
                return { status: 400, data: { error: 'Email OR Phone is required' } };
            }
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return { status: 400, data: { error: 'Invalid email format' } };
            }
            const identifier = email || phone;
            const otp = OTPService.generateOTP(identifier, role);
            return { status: 200, data: { message: 'OTP sent successfully', otp } };
        } catch (error) {
            console.error("Send OTP Error:", error);
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'debug_log.txt');
            fs.appendFileSync(logPath, "Send OTP Error: " + error.message + '\n' + error.stack + '\n');
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

    // POST /auth/facebook
    async facebookLogin(req) {
        try {
            const body = await req.json();
            const { accessToken, role } = body;
            if (!accessToken) return { status: 400, data: { error: 'Facebook Access Token required' } };
            const result = await AuthService.facebookAuth(accessToken, role);
            return { status: 200, data: { message: 'Facebook Login successful', token: result.token, isNewUser: result.isNewUser, user: result.user } };
        } catch (error) {
            console.error("Facebook Auth Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Facebook Token' } };
        }
    }

    // POST /auth/apple
    async appleLogin(req) {
        return { status: 501, data: { error: 'Apple Login Not Implemented' } };
    }

    // POST /auth/logout
    async logout(req) {
        try {
            const body = await req.json();
            const { token } = body;
            if (!token) return { status: 400, data: { error: 'Token required' } };
            const result = await AuthService.logout(token);
            return { status: 200, data: { message: 'Logout successful', result } };
        } catch (error) {
            console.error("Logout Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Token' } };
        }
    }

    // GET /auth/verify
    async verify(req) {
        try {
            const body = await req.json();
            const { token } = body;
            if (!token) return { status: 400, data: { error: 'Token required' } };
            const result = await AuthService.verify(token);
            return { status: 200, data: { message: 'Token verified successfully', result } };
        } catch (error) {
            console.error("Verify Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Token' } };
        }
    }

    // GET /auth/refresh
    async refresh(req) {
        try {
            const body = await req.json();
            const { token } = body;
            if (!token) return { status: 400, data: { error: 'Token required' } };
            const result = await AuthService.refresh(token);
            return { status: 200, data: { message: 'Token refreshed successfully', result } };
        } catch (error) {
            console.error("Refresh Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Token' } };
        }
    }

    // GET /auth/me
    async me(req) {
        try {
            const body = await req.json();
            const { token } = body;
            if (!token) return { status: 400, data: { error: 'Token required' } };
            const result = await AuthService.me(token);
            return { status: 200, data: { message: 'User fetched successfully', result } };
        } catch (error) {
            console.error("Me Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Token' } };
        }
    }

    // GET /auth/forget-password
    async forgetPassword(req) {
        try {
            const body = await req.json();
            const { email } = body;
            if (!email) return { status: 400, data: { error: 'Email required' } };
            const result = await AuthService.forgetPassword(email);
            return { status: 200, data: { message: 'Password reset email sent successfully', result } };
        } catch (error) {
            console.error("Forget Password Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Email' } };
        }
    }

    // POST /auth/reset-password
    async resetPassword(req) {
        try {
            const body = await req.json();
            const { email, password } = body;
            if (!email || !password) return { status: 400, data: { error: 'Email and Password required' } };
            const result = await AuthService.resetPassword(email, password);
            return { status: 200, data: { message: 'Password reset successfully', result } };
        } catch (error) {
            console.error("Reset Password Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Email' } };
        }
    }

    // POST /auth/change-password
    async changePassword(req) {
        try {
            const body = await req.json();
            const { email, password } = body;
            if (!email || !password) return { status: 400, data: { error: 'Email and Password required' } };
            const result = await AuthService.changePassword(email, password);
            return { status: 200, data: { message: 'Password changed successfully', result } };
        } catch (error) {
            console.error("Change Password Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Email' } };
        }
    }

    // POST /auth/update-profile
    async updateProfile(req) {
        try {
            const body = await req.json();
            const { email, password } = body;
            if (!email || !password) return { status: 400, data: { error: 'Email and Password required' } };
            const result = await AuthService.updateProfile(email, password);
            return { status: 200, data: { message: 'Profile updated successfully', result } };
        } catch (error) {
            console.error("Update Profile Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Email' } };
        }
    }

    // POST /auth/delete-profile
    async deleteProfile(req) {
        try {
            const body = await req.json();
            const { email, password } = body;
            if (!email || !password) return { status: 400, data: { error: 'Email and Password required' } };
            const result = await AuthService.deleteProfile(email, password);
            return { status: 200, data: { message: 'Profile deleted successfully', result } };
        } catch (error) {
            console.error("Delete Profile Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Email' } };
        }
    }

    // POST /auth/logout-all
    async logoutAll(req) {
        try {
            const body = await req.json();
            const { email, password } = body;
            if (!email || !password) return { status: 400, data: { error: 'Email and Password required' } };
            const result = await AuthService.logoutAll(email, password);
            return { status: 200, data: { message: 'Profile deleted successfully', result } };
        } catch (error) {
            console.error("Delete Profile Error:", error);
            return { status: 400, data: { error: error.message || 'Invalid Email' } };
        }
    }

}

module.exports = new AuthController();
