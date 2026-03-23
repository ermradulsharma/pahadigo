import AuthService from '@/services/AuthService.js';
import OTPService from '@/services/OTPService.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { parseBody } from '@/helpers/parseBody.js';
import { parseNestedFormData } from '@/helpers/parseNestedFormData.js';
import { uploadToCloudinary } from '@/helpers/cloudinary.js';
import { schemas, validate } from '@/helpers/validation.js';
import User from '@/models/User.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

class AuthController {

    // POST /auth/otp (Send OTP for Email or Phone)
    async sendOtp(req) {
        try {
            const body = await parseBody(req);
            
            // 1. Validate Input using Zod Schema
            const validationResult = validate(schemas.otpSend, body);
            if (!validationResult.success) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, validationResult.error, {});
            }

            const { email, phone, role } = validationResult.data;
            const identifier = email ? email.toLowerCase().trim() : phone.trim();
            const normalizedRole = role ? role.toLowerCase().trim() : undefined;

            // 2. Delegate Business Logic to Data/Service Layer
            const otp = await AuthService.requestOtp({ 
                identifier, 
                role: normalizedRole, 
                termsAccepted: body.termsAccepted 
            });

            // 3. Return Clean Response
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.OTP_SENT, { otp, email, phone });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.AUTH.OTP_SEND_FAILED, {});
        }
    }

    // POST /auth/login (Password Login for Admin/Dev)
    async login(req) {
        try {
            const body = req.validData || req.jsonBody || await parseBody(req);
            const { email, password, rememberMe } = body;

            const result = await AuthService.loginWithPassword({ email, password, rememberMe });
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, result);
        } catch (error) {
            return errorResponse(HTTP_STATUS.UNAUTHORIZED, error.message || RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS, {});
        }
    }

    // POST /auth/verify (Verify OTP and Login/Signup)
    async verifyOtp(req) {
        try {
            const body = await parseBody(req);
            
            // 1. Zod Validation & Transformation
            const validationResult = validate(schemas.otpLogin, body);
            if (!validationResult.success) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, validationResult.error, {});
            }

            // `identifier` and `targetRole` are normalized by the schema transformer
            const { identifier, otp, targetRole } = validationResult.data;

            // 2. Delegate to Service Layer
            const result = await AuthService.verifyAndLogin({ identifier, otp, targetRole });
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, {
                ...(result.user.toObject ? result.user.toObject() : result.user),
                token: result.token,
                role: result.role,
                isNewUser: result.isNewUser,
                businessProfileStatus: result.businessProfileStatus,
                businessProfile: result.businessProfile
            });
        } catch (error) {
            if (error.message === RESPONSE_MESSAGES.AUTH.INVALID_OTP) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.AUTH.INVALID_OTP, {});
            }
            if (error.message === RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD, {});
            }
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
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
            const body = await parseBody(req);
            const { email, password } = body;
            if (!email || !password) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            await AuthService.resetPassword(email, password);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.AUTH.PASSWORD_RESET_SUCCESS, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    async changePassword(req) {
        try {
            const body = await parseBody(req);
            const { email, oldPassword, newPassword } = body;
            if (!email || !oldPassword || !newPassword) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const user = await User.findOne({ email }).select('+password');
            if (!user) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, {});

            const isMatch = await user.comparePassword(oldPassword);
            if (!isMatch) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS, {});

            await AuthService.changePassword(email, newPassword);
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
                body = await parseBody(req);
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