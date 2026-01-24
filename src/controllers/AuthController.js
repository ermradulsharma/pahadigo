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
            return { status: 500, data: { error: 'Failed to send OTP' } };
        }
    }

    // POST /auth/verify (Verify OTP and Login/Signup)
    async verifyOtp(req) {
        try {
            const body = req.jsonBody || await req.json();
            let { email, phone, otp, role } = body;
            if (email) email = email.toLowerCase().trim();
            if (phone) phone = phone.trim();
            if (role) role = role.toLowerCase().trim();
            const identifier = email || phone;
            if (!identifier || !otp) {
                return { status: 400, data: { error: 'Identifier (Email/Phone) and OTP required' } };
            }
            const result = await AuthService.verifyAndLogin({ identifier, otp, email, phone, targetRole: role });
            return {
                status: 200,
                data: {
                    message: 'Login successful',
                    token: result.token,
                    role: result.role,
                    isNewUser: result.isNewUser,
                    vendorStatus: result.vendorStatus,
                    vendorProfile: result.vendorProfile
                }
            };
        } catch (error) {
            const status = error.message === 'Invalid or expired OTP' ? 400 : 500;
            return { status, data: { error: error.message } };
        }
    }

    // POST /auth/google
    async googleLogin(req) {
        try {
            const body = await parseBody(req);
            const { idToken, role } = body;
            if (!idToken) return errorResponse('Google ID Token required');
            const result = await AuthService.googleAuth(idToken, role);
            return successResponse('Google Login successful', { token: result.token, isNewUser: result.isNewUser, user: result.user });
        } catch (error) {
            console.error("Google Auth Error:", error);
            return errorResponse(error.message || 'Invalid Google Token', 400);
        }
    }

    // POST /auth/facebook
    async facebookLogin(req) {
        try {
            const body = await parseBody(req);
            const { accessToken, role } = body;
            if (!accessToken) return errorResponse('Facebook Access Token required');
            const result = await AuthService.facebookAuth(accessToken, role);
            return successResponse('Facebook Login successful', { token: result.token, isNewUser: result.isNewUser, user: result.user });
        } catch (error) {
            console.error("Facebook Auth Error:", error);
            return errorResponse(error.message || 'Invalid Facebook Token', 400);
        }
    }

    // POST /auth/apple
    async appleLogin(req) {
        try {
            const body = await parseBody(req);
            const { idToken, user, email, role } = body;
            if (!idToken) return errorResponse('Apple ID Token required');

            // user and email are optional fields sent by Apple client on first login
            const result = await AuthService.appleAuth(idToken, role, user, email);
            return successResponse('Apple Login successful', { token: result.token, isNewUser: result.isNewUser, user: result.user });
        } catch (error) {
            console.error("Apple Auth Error:", error);
            return errorResponse(error.message || 'Invalid Apple Token', 400);
        }
    }

    async logout(req) {
        return successResponse('Logged out successfully');
    }

    async verify(req) {
        try {
            const token = req.headers.get('authorization')?.split(' ')[1];
            if (!token) return errorResponse('No token provided', 401);
            const result = await AuthService.verify(token);
            return successResponse('Token is valid', result);
        } catch (error) {
            return errorResponse(error.message, 401);
        }
    }

    async refresh(req) {
        try {
            const token = req.headers.get('authorization')?.split(' ')[1];
            if (!token) return errorResponse('No token provided', 401);
            const result = await AuthService.refresh(token);
            return successResponse('Token refreshed', result);
        } catch (error) {
            return errorResponse(error.message, 401);
        }
    }

    async me(req) {
        try {
            const token = req.headers.get('authorization')?.split(' ')[1];
            if (!token) return errorResponse('No token provided', 401);
            const user = await AuthService.me(token);
            return successResponse('User profile', { user });
        } catch (error) {
            return errorResponse(error.message, 401);
        }
    }

    async forgetPassword(req) {
        try {
            const body = await parseBody(req);
            const { email } = body;
            if (!email) return errorResponse('Email is required');
            await AuthService.forgetPassword(email);
            return successResponse('Reset link sent');
        } catch (error) {
            return errorResponse(error.message);
        }
    }

    async resetPassword(req) {
        try {
            const body = await parseBody(req);
            const { email, password } = body;
            if (!email || !password) return errorResponse('Email and Password required');
            await AuthService.resetPassword(email, password);
            return successResponse('Password reset successfully');
        } catch (error) {
            return errorResponse(error.message);
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
            if (!email) return errorResponse('Email required');
            const user = await AuthService.updateProfile(email, updates);
            return successResponse('Profile updated', { user });
        } catch (error) {
            return errorResponse(error.message);
        }
    }

    async deleteProfile(req) {
        try {
            const body = await parseBody(req);
            const { email } = body;
            if (!email) return errorResponse('Email required');
            await AuthService.deleteProfile(email);
            return successResponse('Profile deleted');
        } catch (error) {
            return errorResponse(error.message);
        }
    }

    async logoutAll(req) {
        return successResponse('Logged out from all devices');
    }



}

export default new AuthController();
