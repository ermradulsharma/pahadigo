import { AdminAuthService, UserAuthService, BaseAuthService } from '@/services/Auth/index.js';
import OTPService from '@/services/Auth/User/OTPService.js';
import { parseBody } from '@/helpers/parseBody.js';
import { parseNestedFormData } from '@/helpers/parseNestedFormData.js';
import { uploadToCloudinary } from '@/helpers/cloudinary.js';
import { schemas, validate } from '@/helpers/validation.js';
import User from '@/models/User.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, USER_ROLES } from '@/constants/index.js';
import { transformAuthResponse } from '@/helpers/index.js';
import AuthEvents from '@/core/Events/AuthEvents.js';
import Controller from '@/controllers/Controller.js';

/**
 * AuthController - Handles all authentication related logic.
 * Extends the Base Controller for standardized responses.
 */
class AuthController extends Controller {

  // POST /auth/otp (Send OTP for Email or Phone)
  // POST /auth/otp
  async initiateOTP(req) {
    try {
      const body = req.payload;
      const { email, phone, role, termsAccepted } = body;

      // Basic presence checks
      if (!email && !phone) {
        return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.EITHER_IDENTIFIER_REQUIRED);
      }

      if (!(termsAccepted === true || termsAccepted === 'true')) {
        return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.TERMS_REQUIRED);
      }

      // Schema Validation
      const validationResult = validate(schemas.otpSend, { email, phone, role });
      if (!validationResult.success) {
        return this.error(HTTP_STATUS.BAD_REQUEST, validationResult.error);
      }

      const { email: validEmail, phone: validPhone, role: validRole } = validationResult.data;
      const identifier = validEmail ? validEmail.toLowerCase().trim() : validPhone.trim();

      const otp = await UserAuthService.initiateOTP({
        identifier,
        role: validRole || 'traveller',
        termsAccepted: true
      });

      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.OTP_SENT, { otp, email: validEmail, phone: validPhone });
    } catch (error) {
      console.error("[AuthController.initiateOTP] Error:", error);
      if (error.message === RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD) {
        return this.error(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD);
      }
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.AUTH.OTP_FAILED);
    }
  }

  // POST /auth/login (Password Login for Admin/Dev)
  // POST /auth/login
  async authenticate(req) {
    try {
      const body = req.validData || req.jsonBody || await parseBody(req);
      const { email, password, rememberMe } = body;
      const result = await AdminAuthService.authenticateWithPassword({ email, password, rememberMe });

      const ip = req.headers.get('x-forwarded-for') || req.socket?.remoteAddress;
      const device = req.headers.get('user-agent');
      AuthEvents.emit('auth.login_success', { user: result.user, metadata: { ip, device, identifier: email } });

      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
    } catch (error) {
      return this.error(HTTP_STATUS.UNAUTHORIZED, error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }
  }

  // POST /auth/verify-otp
  // POST /auth/verify-otp
  async confirmOTP(req) {
    try {
      const body = await parseBody(req);
      const rawPayload = { identifier: body.email || body.phone, otp: body.otp, targetRole: body.role || body.targetRole };

      const validationResult = validate(schemas.otpLogin, rawPayload);
      if (!validationResult.success) {
        return this.error(HTTP_STATUS.BAD_REQUEST, validationResult.error);
      }

      const { identifier, otp, targetRole } = validationResult.data;
      const result = await UserAuthService.authenticateWithOTP({ identifier, otp, targetRole });

      const ip = req.headers.get('x-forwarded-for') || req.socket?.remoteAddress;
      const device = req.headers.get('user-agent');
      AuthEvents.emit('auth.login_success', { user: result.user, metadata: { ip, device, identifier } });

      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
    } catch (error) {
      return this.error(HTTP_STATUS.UNAUTHORIZED, error.message || RESPONSE_MESSAGES.AUTH.INVALID_OTP);
    }
  }

  // POST /auth/social
  async socialAuthenticateGoogle(req) {
    try {
      const body = await parseBody(req);
      const validationResult = validate(schemas.socialLogin, { token: body.idToken, role: body.role });
      if (!validationResult.success) return this.error(HTTP_STATUS.BAD_REQUEST, validationResult.error);
      const result = await UserAuthService.authenticateWithGoogle(validationResult.data.token, validationResult.data.role);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }
  }

  async socialAuthenticateFacebook(req) {
    try {
      const body = await parseBody(req);
      const validationResult = validate(schemas.socialLogin, { token: body.accessToken, role: body.role });
      if (!validationResult.success) return this.error(HTTP_STATUS.BAD_REQUEST, validationResult.error);
      const result = await UserAuthService.authenticateWithFacebook(validationResult.data.token, validationResult.data.role);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }
  }

  async socialAuthenticateApple(req) {
    try {
      const body = await parseBody(req);
      if (!body.idToken) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);
      const result = await UserAuthService.authenticateWithApple(body.idToken, body.role, body.user, body.email);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, transformAuthResponse(result));
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }
  }

  async logout(req) {
    return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS);
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
      const token = req.headers.get('authorization')?.split(' ')[1];
      if (!token) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.NO_TOKEN);
      const result = await BaseAuthService.refreshToken(token);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.TOKEN_REFRESHED, result);
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
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  async upgradeToVendor(req) {
    try {
      if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
      const result = await UserAuthService.upgradeToVendor(req.user.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.UPGRADED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  async downgradeToTraveller(req) {
    try {
      if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
      const result = await UserAuthService.downgradeToTraveller(req.user.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.DOWNGRADED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
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
      const body = await parseBody(req);
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
      const body = await parseBody(req);
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
      const body = await parseBody(req);
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

  async deleteAccount(req) {
    try {
      if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
      let reason = null;
      try { reason = (await parseBody(req)).reason; } catch (e) { }

      await BaseAuthService.deactivateUserAccount(req.user.id, reason);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const authController = new AuthController();
export default authController;
