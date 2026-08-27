import { AdminAuthService, UserAuthService, BaseAuthService } from '@/core/Services/Auth/index.js';
import OTPService from '@/core/Services/Auth/User/OTPService.js';
import { parseBody } from '@/core/Helpers/parseBody.js';
import { parseNestedFormData } from '@/core/Helpers/parseNestedFormData.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { schemas, validate } from '@/core/Helpers/validation.js';
import User from '@/core/Models/User.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, USER_ROLES } from '@/core/Constants/index.js';
import { transformAuthResponse, userAuthResponse, businessAuthResponse } from '@/core/Helpers/index.js';
import AuthEvents from '@/core/Events/AuthEvents.js';
import Controller from '@/core/Controllers/Controller.js';
import requestContextMiddleware from '@/core/Http/Middleware/requestContext.js';

/**
 * AuthController - Handles all authentication related logic.
 * Extends the Base Controller for standardized responses.
 */
class AuthController extends Controller {

    // POST /auth/otp (Send OTP for Email or Phone)
    // POST /auth/otp
    async initiateOTP(req) {
        try {
            const { email, phone, role, termsAccepted } = req.payload;

            // Basic presence checks
            if (!email && !phone) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.EITHER_IDENTIFIER_REQUIRED);
            if (!termsAccepted) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.TERMS_REQUIRED);
            if (!role) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ROLE_REQUIRED);

            // Schema Validation
            const validationResult = validate(schemas.otpSend, { email, phone, role });
            if (!validationResult.success) return this.error(HTTP_STATUS.BAD_REQUEST, validationResult.error);

            const { email: validEmail, phone: validPhone, role: validRole } = validationResult.data;
            const identifier = validEmail ? validEmail.toLowerCase().trim() : validPhone.trim();
            const otp = await UserAuthService.initiateOTP({ identifier, role: validRole, termsAccepted: true });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.OTP_SENT, { otp, email: validEmail, phone: validPhone });
        } catch (error) {
            if (error.message === RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD) return this.error(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.AUTH.OTP_FAILED);
        }
    }

    // POST /auth/login (Password Login for Admin/Dev)
    // POST /auth/login
    async authenticate(req) {
        try {
            const { email, password, rememberMe } = req.payload;
            const result = await AdminAuthService.authenticateWithPassword({ email, password, rememberMe });

            const ip = req.headers.get('x-forwarded-for') || req.socket?.remoteAddress;
            const device = req.headers.get('user-agent');
            AuthEvents.emit('auth.login_success', { user: result.user, metadata: { ip, device, identifier: email } });

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
        } catch (error) {
            return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
    }

    // POST /auth/verify-otp
    // POST /auth/verify-otp
    async confirmOTP(req) {
        try {
            const body = req.payload;
            const payload = { identifier: body.email || body.phone, otp: body.otp, targetRole: body.role };

            const validationResult = validate(schemas.otpLogin, payload);
            if (!validationResult.success) return this.error(HTTP_STATUS.BAD_REQUEST, validationResult.error);

            const { identifier, otp, targetRole } = validationResult.data;
            const result = await UserAuthService.authenticateWithOTP({ identifier, otp, targetRole });

            const { ip, realIp, device, rawDevice, location } = requestContextMiddleware(req);
            AuthEvents.emit('auth.login_success', { user: result, metadata: { ip, realIp, device, rawDevice, location, identifier, authMethod: 'OTP Verification', role: result.user?.role } });
            if (result.isNewUser) {
                AuthEvents.emit('auth.welcome', { identifier, user: result });
            }
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
        } catch (error) {
            return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.INVALID_OTP);
        }
    }

    // POST /auth/social
    async socialAuthenticateGoogle(req) {
        try {
            const body = req.payload;
            const validationResult = validate(schemas.socialLogin, { token: body.id_token, role: body.role });
            if (!validationResult.success) return this.error(HTTP_STATUS.BAD_REQUEST, validationResult.error);
            const result = await UserAuthService.authenticateWithGoogle(validationResult.data.token, validationResult.data.role);

            const { ip, realIp, device, rawDevice, location } = requestContextMiddleware(req);
            const identifier = result.user?.email || result.user?.phone || '';
            AuthEvents.emit('auth.login_success', { user: result.user, metadata: { ip, realIp, device, rawDevice, location, identifier, authMethod: 'Google OAuth', role: result.user?.role } });
            if (result.isNewUser && identifier) {
                AuthEvents.emit('auth.welcome', { identifier, user: result.user });
            }

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
    }

    async socialAuthenticateFacebook(req) {
        try {
            const body = req.payload;
            const validationResult = validate(schemas.socialLogin, { token: body.accessToken, role: body.role });
            if (!validationResult.success) return this.error(HTTP_STATUS.BAD_REQUEST, validationResult.error);
            const result = await UserAuthService.authenticateWithFacebook(validationResult.data.token, validationResult.data.role);

            const { ip, realIp, device, rawDevice, location } = requestContextMiddleware(req);
            const identifier = result.user?.email || result.user?.phone || '';
            AuthEvents.emit('auth.login_success', { user: result.user, metadata: { ip, realIp, device, rawDevice, location, identifier, authMethod: 'Facebook OAuth', role: result.user?.role } });
            if (result.isNewUser && identifier) {
                AuthEvents.emit('auth.welcome', { identifier, user: result.user });
            }

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
    }

    async socialAuthenticateApple(req) {
        try {
            const body = req.payload;
            if (!body.idToken) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);
            const result = await UserAuthService.authenticateWithApple(body.idToken, body.role, body.user, body.email);

            const { ip, realIp, device, rawDevice, location } = requestContextMiddleware(req);
            const identifier = result.user?.email || result.user?.phone || '';
            AuthEvents.emit('auth.login_success', { user: result.user, metadata: { ip, realIp, device, rawDevice, location, identifier, authMethod: 'Apple OAuth', role: result.user?.role } });
            if (result.isNewUser && identifier) {
                AuthEvents.emit('auth.welcome', { identifier, user: result.user });
            }

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
        }
    }

    async logout(req) {
        try {
            const token = req.headers.get('authorization')?.split(' ')[1];
            if (!token) return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS);

            let body = {};
            try { body = req.payload; } catch (e) { }
            const refreshToken = body.refreshToken || null;

            await BaseAuthService.logout(token, refreshToken);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS);
        } catch (error) {
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS);
        }
    }

    async verifyToken(req) {
        try {
            const token = req.headers.get('authorization')?.split(' ')[1];
            if (!token) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.NO_TOKEN);
            const result = await BaseAuthService.verifyToken(token);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.TOKEN_VALID, result);
        } catch (error) {
            return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
        }
    }

    async refreshToken(req) {
        try {
            const body = req.payload;
            let token = body.refreshToken;
            if (!token) token = req.headers.get('authorization')?.split(' ')[1];
            if (!token) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.NO_TOKEN);

            const tokens = await BaseAuthService.refreshToken(token);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.TOKEN_REFRESHED, { tokens });
        } catch (error) {
            return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
        }
    }

    async switchRole(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            const result = await UserAuthService.toggleRole(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.ROLE_SWITCHED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async upgradeToVendor(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            await UserAuthService.upgradeToVendor(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.UPGRADED);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
        }
    }

    async downgradeToTraveller(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            await UserAuthService.downgradeToTraveller(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.DOWNGRADED);
        } catch (error) {
            return this.error(HTTP_STATUS.BAD_REQUEST, error.message);
        }
    }

    async getUserProfile(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            const userProfile = await BaseAuthService.getUserProfile(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.USER.FETCHED, transformAuthResponse(userProfile));
        } catch (error) {
            return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_INVALID);
        }
    }

    async forgotPassword(req) {
        try {
            const body = req.payload;
            if (!body.email) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.EMAIL_REQUIRED);
            await AdminAuthService.initiatePasswordReset(body.email);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_LINK_SENT);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async resetPassword(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            const body = req.payload;
            if (!body.otp || !body.password) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

            const user = await User.findById(req.user.id);
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND);

            // Verification logic...
            const otpRecord = await OTPService.verifyOTP(user.email || user.phone, body.otp);
            if (!otpRecord) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.AUTH.INVALID_OTP);

            await AdminAuthService.resetPassword(user._id, body.password);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async changePassword(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            const body = req.payload;
            if (!body.oldPassword || !body.newPassword) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

            const user = await User.findById(req.user.id).select('+password');
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND);

            const isMatch = await user.comparePassword(body.oldPassword);
            if (!isMatch) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);

            await AdminAuthService.updatePassword(user._id, body.newPassword);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async updateUserProfile(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            let body = req.formDataBody ? parseNestedFormData(req.formDataBody) : (req.validData || req.jsonBody || await parseBody(req));

            if (req.formDataBody?.get('profileImage') instanceof File) {
                const result = await uploadToCloudinary(req.formDataBody.get('profileImage'), `profile/${req.user.id}`);
                body.profileImage = result.url;
            }

            const { password, role, _id, ...updates } = body;
            const updatedUser = await BaseAuthService.updateUserProfile(req.user.id, updates);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.PROFILE_UPDATED, updatedUser);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async initiateDeleteAccount(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
            const user = await User.findById(req.user.id).lean();
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND);

            const identifier = user.email || user.phone;
            if (!identifier) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.EITHER_IDENTIFIER_REQUIRED);

            await OTPService.generateOTP(identifier, user.role, { action: 'delete_account' });
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.OTP_SENT);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    async deleteAccount(req) {
        try {
            if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);

            const body = req.payload;
            const { otp, reason } = body;

            if (!otp) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

            const user = await User.findById(req.user.id).lean();
            if (!user) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND);

            const identifier = user.email || user.phone;
            const otpRecord = await OTPService.verifyOTP(identifier, otp);

            if (!otpRecord) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.AUTH.INVALID_OTP);

            await BaseAuthService.deactivateUserAccount(req.user.id, reason);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const authController = new AuthController();
export default authController;
