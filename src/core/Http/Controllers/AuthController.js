import AuthService from '@/services/AuthService.js';
import OTPService from '@/services/OTPService.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { parseBody } from '@/helpers/parseBody.js';
import { parseNestedFormData } from '@/helpers/parseNestedFormData.js';
import { uploadToCloudinary } from '@/helpers/cloudinary.js';
import { schemas, validate } from '@/helpers/validation.js';
import User from '@/models/User.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, USER_ROLES } from '../../Constants/index.js';
import AuthEvents from '@/core/Events/AuthEvents.js';

class AuthController {

  // POST /auth/otp (Send OTP for Email or Phone)
  async sendOtp(req) {
    try {
      const body = await parseBody(req);
      const { email, phone, role, termsAccepted } = body;
      if (!email && !phone) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.EITHER_IDENTIFIER_REQUIRED, {});
      }
      if (!(termsAccepted === true || termsAccepted === 'true')) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.TERMS_REQUIRED, {});
      }
      const identifier = email ? email.toLowerCase().trim() : phone.trim();
      const termsAndConditionsAccepted = termsAccepted === 'true' || termsAccepted === true;
      const otp = await AuthService.requestOtp({
        identifier,
        role: role ? role.toLowerCase() : 'traveller',
        termsAndConditionsAccepted
      });
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.OTP_SENT, { otp, email, phone });
    } catch (error) {
      console.error("[AuthController.sendOtp] Error:", error);
      if (error.message === RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD) {
        return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD, {});
      }
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.AUTH.OTP_FAILED, {});
    }
  }

  // POST /auth/login (Password Login for Admin/Dev)
  async login(req) {
    try {
      const body = req.validData || req.jsonBody || await parseBody(req);
      const { email, password, rememberMe } = body;
      const result = await AuthService.loginWithPassword({ email, password, rememberMe });
      const ip = req.headers.get('x-forwarded-for') || req.socket?.remoteAddress;
      const device = req.headers.get('user-agent');
      AuthEvents.emit('auth.login_success', { user: result.user, metadata: { ip, device, identifier: email } });
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, result);
    } catch (error) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS, {});
    }
  }

  // POST /auth/verify-otp
  async verifyOtp(req) {
    try {
      const body = await parseBody(req);
      const rawPayload = { identifier: body.email || body.phone, otp: body.otp, targetRole: body.role || body.targetRole };
      const validationResult = validate(schemas.otpLogin, rawPayload);
      if (!validationResult.success) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, validationResult.error, {});
      }
      const { identifier, otp, targetRole } = validationResult.data;
      const result = await AuthService.verifyAndLogin({ identifier, otp, targetRole });
      const ip = req.headers.get('x-forwarded-for') || req.socket?.remoteAddress;
      const device = req.headers.get('user-agent');
      AuthEvents.emit('auth.login_success', { user: result.user, metadata: { ip, device, identifier } });
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, {
        ...(result.user.toObject ? result.user.toObject() : result.user),
        token: result.token,
        role: result.role,
        isNewUser: result.isNewUser,
        businessProfileStatus: result.businessProfileStatus,
        businessProfile: result.businessProfile
      });
    } catch (error) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, error.message || RESPONSE_MESSAGES.AUTH.INVALID_OTP, {});
    }
  }

  // POST /auth/google
  async googleLogin(req) {
    try {
      const body = await parseBody(req);

      // Validation
      const validationResult = validate(schemas.socialLogin, { token: body.idToken, role: body.role });
      if (!validationResult.success) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, validationResult.error, {});
      }

      const { token, role } = validationResult.data;

      // Delegate to Service
      const result = await AuthService.googleAuth(token, role);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, result);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS, {});
    }
  }

  // POST /auth/facebook
  async facebookLogin(req) {
    try {
      const body = await parseBody(req);

      const validationResult = validate(schemas.socialLogin, { token: body.accessToken, role: body.role });
      if (!validationResult.success) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, validationResult.error, {});
      }

      const { token, role } = validationResult.data;
      const result = await AuthService.facebookAuth(token, role);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, result);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS, {});
    }
  }

  // POST /auth/apple
  async appleLogin(req) {
    try {
      const body = await parseBody(req);
      const { idToken, user, email, role } = body;
      if (!idToken) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      // user and email are optional fields sent by Apple client on first login
      const result = await AuthService.appleAuth(idToken, role, user, email);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, result);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS, {});
    }
  }

  async logout(req) {
    return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS, {});
  }

  async verify(req) {
    try {
      const token = req.headers.get('authorization')?.split(' ')[1];
      if (!token) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.NO_TOKEN, {});
      const result = await AuthService.verify(token);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.TOKEN_VALID, result);
    } catch (error) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_INVALID, {});
    }
  }

  async refresh(req) {
    try {
      const token = req.headers.get('authorization')?.split(' ')[1];
      if (!token) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.NO_TOKEN, {});
      const result = await AuthService.refresh(token);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.TOKEN_REFRESHED, result);
    } catch (error) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_INVALID, {});
    }
  }

  async switchRole(req) {
    try {
      const userContext = req.user;
      if (!userContext || !userContext.id) {
        return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});
      }

      const result = await AuthService.switchRole(userContext.id);
      return successResponse(HTTP_STATUS.OK, "Role switched successfully", result);
    } catch (error) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async becomeVendor(req) {
    try {
      const userContext = req.user;
      if (!userContext || !userContext.id) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

      const result = await AuthService.becomeVendor(userContext.id);
      return successResponse(HTTP_STATUS.OK, "Role updated to Vendor successfully", result);
    } catch (error) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async becomeTraveller(req) {
    try {
      const userContext = req.user;
      if (!userContext || !userContext.id) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

      const result = await AuthService.becomeTraveller(userContext.id);
      return successResponse(HTTP_STATUS.OK, "Role updated to Traveller successfully", result);
    } catch (error) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async me(req) {
    try {
      // Using middleware auth context
      const userContext = req.user;

      if (!userContext || !userContext.id) {
        // Fallback for direct calls without middleware (though route has middleware now)
        const token = req.headers.get('authorization')?.split(' ')[1];
        if (!token) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.NO_TOKEN, {});
        const user = await AuthService.me(token);
        return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.TOKEN_VALID, user);
      }

      const userProfile = await AuthService.getProfileById(userContext.id);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.USER.FETCHED, userProfile);
    } catch (error) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_INVALID, {});
    }
  }

  async forgetPassword(req) {
    try {
      const body = await parseBody(req);
      const { email } = body;
      if (!email) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.EMAIL_REQUIRED, {});
      await AuthService.forgetPassword(email);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_LINK_SENT, {});
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async resetPassword(req) {
    try {
      const userContext = req.user;
      if (!userContext || !userContext.id) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

      const body = await parseBody(req);
      const { otp, password } = body;
      if (!otp || !password) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      const user = await User.findById(userContext.id);
      if (!user) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, {});
      if (user.role !== USER_ROLES.ADMIN) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD, {});

      const identifier = user.email || user.phone;
      const otpRecord = await OTPService.verifyOTP(identifier, otp);
      if (!otpRecord) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.AUTH.INVALID_OTP, {});

      await AuthService.resetPassword(user._id, password);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS, {});
    } catch (error) {
      console.error("Reset Password Error:", error);
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async changePassword(req) {
    try {
      const userContext = req.user;
      if (!userContext || !userContext.id) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

      const body = await parseBody(req);
      const { oldPassword, newPassword } = body;
      if (!oldPassword || !newPassword) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
      }

      const user = await User.findById(userContext.id).select('+password');
      if (!user) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, {});
      if (user.role !== USER_ROLES.ADMIN) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD, {});

      const isMatch = await user.comparePassword(oldPassword);
      if (!isMatch) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS, {});

      await AuthService.changePassword(user._id, newPassword);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, {});
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async updateProfile(req) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});
      }

      let body;
      if (req.formDataBody) {
        body = parseNestedFormData(req.formDataBody);

        // Handle profile image upload
        const profileImageFile = req.formDataBody.get('profileImage');
        if (profileImageFile && profileImageFile instanceof File) {
          const result = await uploadToCloudinary(profileImageFile, `profile/${user.id}`);
          body.profileImage = result.url;
        }
      } else {
        body = req.validData || req.jsonBody || await parseBody(req);
      }

      // Prevent users from updating sensitive fields like email, password, role directly through this endpoint
      // (Password/Role should have dedicated endpoints if needed)
      const { email, password, role, _id, ...updates } = body;

      // Use ID from authenticated user context, which is more reliable than email in body or token
      const updatedUser = await AuthService.updateProfileById(user.id, updates);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.PROFILE_UPDATED, updatedUser);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async deleteProfile(req) {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});
      }

      let reason = null;
      try {
        // Try to parse reason from body if available
        const body = await parseBody(req);
        reason = body.reason || body.deletedReason;
      } catch (e) {
        // Ignore body parsing errors for delete, reason is optional
      }

      await AuthService.deleteProfileById(user.id, reason);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, {});
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async logoutAll(req) {
    return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS, {});
  }



}

const authController = new AuthController();
export default authController;
