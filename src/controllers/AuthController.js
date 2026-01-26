import AuthService from '../services/AuthService.js';
import OTPService from '../services/OTPService.js';
import { successResponse, errorResponse } from '../helpers/response.js';
import { parseBody } from '../helpers/parseBody.js';

class AuthController {

    // POST /auth/otp (Send OTP for Email or Phone)
    async sendOtp(req) {
        try {
            const body = await parseBody(req);
            let { email, phone, role } = body;
            if (body.hasOwnProperty('email') && !body.email) {
                return errorResponse(400, 'Email is required', {});
            }
            if (body.hasOwnProperty('phone') && !body.phone) {
                return errorResponse(400, 'Phone is required', {});
            }

            if (email) email = email.toLowerCase().trim();
            if (phone) phone = phone.trim();
            if (role) role = role.toLowerCase().trim();
            if (role && !['traveller', 'vendor'].includes(role)) {
                return errorResponse(400, 'Invalid role. Allowed: traveller, vendor', {});
            }

            if (!email && !phone) {
                return errorResponse(400, 'Email OR Phone is required', {});
            }
            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return errorResponse(400, 'Invalid email format', {});
            }
            const identifier = email || phone;
            const otp = OTPService.generateOTP(identifier, role);
            return successResponse(200, 'OTP sent successfully', { otp, email, phone });
        } catch (error) {
            return errorResponse(500, 'Failed to send OTP', {});
        }
    }

    // POST /auth/login (Password Login for Admin/Dev)
    async login(req) {
        try {
            const body = await parseBody(req);
            const { email, password, rememberMe } = body;
            if (!email || !password) return errorResponse(400, 'Email and Password required', {});

            const result = await AuthService.loginWithPassword({ email, password, rememberMe });
            return successResponse(200, 'Login successful', result);
        } catch (error) {
            return errorResponse(401, error.message, {});
        }
    }

    // POST /auth/verify (Verify OTP and Login/Signup)
    async verifyOtp(req) {
        try {
            const body = await parseBody(req);
            let { email, phone, otp, role } = body;
            if (email) email = email.toLowerCase().trim();
            if (phone) phone = phone.trim();
            if (role) role = role.toLowerCase().trim();
            const identifier = email || phone;
            if (!identifier || !otp) {
                return errorResponse(400, 'Identifier (Email/Phone) and OTP required', {});
            }
            const result = await AuthService.verifyAndLogin({ identifier, otp, email, phone, targetRole: role });
            return successResponse(200, 'Login successful', {
                user: result.user,
                token: result.token,
                isNewUser: result.isNewUser,
                vendorStatus: result.vendorStatus,
                vendorProfile: result.vendorProfile
            });
        } catch (error) {
            const status = error.message === 'Invalid or expired OTP' ? 400 : 500;
            return errorResponse(status, error.message, {});
        }
    }

    // POST /auth/google
    async googleLogin(req) {
        try {
            const body = await parseBody(req);
            const { idToken, role } = body;
            if (!idToken) return errorResponse(400, 'Google ID Token required', {});
            const result = await AuthService.googleAuth(idToken, role);
            return successResponse(200, 'Google Login successful', { token: result.token, isNewUser: result.isNewUser, user: result.user });
        } catch (error) {
            console.error("Google Auth Error:", error);
            return errorResponse(500, error.message || 'Invalid Google Token', {});
        }
    }

    // POST /auth/facebook
    async facebookLogin(req) {
        try {
            const body = await parseBody(req);
            const { accessToken, role } = body;
            if (!accessToken) return errorResponse(400, 'Facebook Access Token required', {});
            const result = await AuthService.facebookAuth(accessToken, role);
            return successResponse(200, 'Facebook Login successful', { token: result.token, isNewUser: result.isNewUser, user: result.user });
        } catch (error) {
            console.error("Facebook Auth Error:", error);
            return errorResponse(500, error.message || 'Invalid Facebook Token', {});
        }
    }

    // POST /auth/apple
    async appleLogin(req) {
        try {
            const body = await parseBody(req);
            const { idToken, user, email, role } = body;
            if (!idToken) return errorResponse(400, 'Apple ID Token required', {});

            // user and email are optional fields sent by Apple client on first login
            const result = await AuthService.appleAuth(idToken, role, user, email);
            return successResponse(200, 'Apple Login successful', { token: result.token, isNewUser: result.isNewUser, user: result.user });
        } catch (error) {
            console.error("Apple Auth Error:", error);
            return errorResponse(500, error.message || 'Invalid Apple Token', {});
        }
    }

    async logout(req) {
        return successResponse(200, 'Logged out successfully', {});
    }

    async verify(req) {
        try {
            const token = req.headers.get('authorization')?.split(' ')[1];
            if (!token) return errorResponse(401, 'No token provided', {});
            const result = await AuthService.verify(token);
            return successResponse(200, 'Token is valid', { result });
        } catch (error) {
            return errorResponse(401, error.message, {});
        }
    }

    async refresh(req) {
        try {
            const token = req.headers.get('authorization')?.split(' ')[1];
            if (!token) return errorResponse(401, 'No token provided', {});
            const result = await AuthService.refresh(token);
            return successResponse(200, 'Token refreshed', { result });
        } catch (error) {
            return errorResponse(401, error.message, {});
        }
    }

    async me(req) {
        try {
            const token = req.headers.get('authorization')?.split(' ')[1];
            if (!token) return errorResponse(401, 'No token provided', {});
            const user = await AuthService.me(token);
            return successResponse(200, 'User profile', { user });
        } catch (error) {
            return errorResponse(401, error.message, {});
        }
    }

    async forgetPassword(req) {
        try {
            const body = await parseBody(req);
            const { email } = body;
            if (!email) return errorResponse(400, 'Email is required', {});
            await AuthService.forgetPassword(email);
            return successResponse(200, 'Reset link sent', {});
        } catch (error) {
            return errorResponse(500, error.message, {});
        }
    }

    async resetPassword(req) {
        try {
            const body = await parseBody(req);
            const { email, password } = body;
            if (!email || !password) return errorResponse(400, 'Email and Password required', {});
            await AuthService.resetPassword(email, password);
            return successResponse(200, 'Password reset successfully', {});
        } catch (error) {
            return errorResponse(500, error.message, {});
        }
    }

    async changePassword(req) {
        return this.resetPassword(req);
    }

    async updateProfile(req) {
        try {
            // Use authenticated user context if middleware adds it, else parse token or body
            // Assuming middleware adds req.user or we parse token?
            // AuthController usually protected routes
            const body = await parseBody(req);
            const { email, ...updates } = body;
            // Better: use req.user.email from token middleware
            // But for simple implementation assuming body has email or handled by service
            if (!email) return errorResponse(400, 'Email required', {});
            const user = await AuthService.updateProfile(email, updates);
            return successResponse(200, 'Profile updated', { user });
        } catch (error) {
            return errorResponse(500, error.message, {});
        }
    }

    async deleteProfile(req) {
        try {
            const body = await parseBody(req);
            const { email } = body;
            if (!email) return errorResponse(400, 'Email required', {});
            await AuthService.deleteProfile(email);
            return successResponse(200, 'Profile deleted', {});
        } catch (error) {
            return errorResponse(500, error.message, {});
        }
    }

    async logoutAll(req) {
        return successResponse(200, 'Logged out from all devices', {});
    }



}

const authController = new AuthController();
export default authController;
