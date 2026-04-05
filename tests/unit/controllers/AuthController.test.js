import AuthController from '../../../src/core/Http/Controllers/AuthController.js';
import AuthService from '../../../src/core/Services/AuthService.js';
import OTPService from '../../../src/core/Services/OTPService.js';
import User from '../../../src/core/Models/User.js';
import { createMockReq, cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, USER_ROLES } from '../../../src/core/Constants/index.js';
import { generateToken } from '../../../src/core/Helpers/jwt.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('Industry Standard: Authentication API', () => {
    let userId;

    beforeEach(async () => {
        await cleanDatabase();
        userId = generateId();
        jest.clearAllMocks();
    });

    describe('Feature: OTP Workflow', () => {
        it('[Success] should issue OTP for valid email', async () => {
            const req = createMockReq({ jsonBody: { email: 'test@example.com', termsAccepted: true } });
            jest.spyOn(AuthService, 'requestOtp').mockResolvedValue('123456');
            
            const res = await AuthController.sendOtp(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const data = await res.json();
            expect(data.data.otp).toBe('123456');
        });

        it('[Security] should block admin OTP requests via public endpoint', async () => {
            const req = createMockReq({ jsonBody: { email: 'admin@system.com', termsAccepted: true } });
            jest.spyOn(AuthService, 'requestOtp').mockRejectedValue(new Error(RESPONSE_MESSAGES.AUTH.DIFFERENT_METHOD));
            
            const res = await AuthController.sendOtp(req);
            expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
        });

        it('[Success] should verify OTP and return identity with token', async () => {
            const req = createMockReq({ jsonBody: { email: 'test@example.com', otp: '123456' } });
            const mockUser = { id: userId.toString(), role: USER_ROLES.TRAVELLER, toObject: () => ({ id: userId.toString() }) };
            
            jest.spyOn(AuthService, 'verifyAndLogin').mockResolvedValue({ 
                user: mockUser, 
                token: 'jwt-token', 
                role: USER_ROLES.TRAVELLER, 
                isNewUser: false 
            });
            
            const res = await AuthController.verifyOtp(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const data = await res.json();
            expect(data.data.token).toBe('jwt-token');
        });
    });

    describe('Feature: Profile Lifecycle', () => {
        it('[Success] should allow authenticated user to update their profile', async () => {
            const req = createMockReq({ 
                user: { id: userId.toString() }, 
                jsonBody: { name: 'New Name' } 
            });
            
            jest.spyOn(AuthService, 'updateProfileById').mockResolvedValue({ name: 'New Name' });
            const res = await AuthController.updateProfile(req);
            
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(AuthService.updateProfileById).toHaveBeenCalledWith(userId.toString(), { name: 'New Name' });
        });

        it('[Privacy] should allow profile deletion with reason preservation', async () => {
            const req = createMockReq({ 
                user: { id: userId.toString() }, 
                jsonBody: { reason: 'Found a better app' } 
            });
            
            jest.spyOn(AuthService, 'deleteProfileById').mockResolvedValue(true);
            const res = await AuthController.deleteProfile(req);
            
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(AuthService.deleteProfileById).toHaveBeenCalledWith(userId.toString(), 'Found a better app');
        });
    });

    describe('Feature: Password Security', () => {
        it('[Security] should block unauthorized role from accessing reset-password', async () => {
            const travelerId = generateId();
            await User.create({ _id: travelerId, role: USER_ROLES.TRAVELLER });
            const req = createMockReq({
                user: { id: travelerId.toString(), role: USER_ROLES.TRAVELLER },
                jsonBody: { otp: '123456', password: 'new' }
            });
            const res = await AuthController.resetPassword(req);
            expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
        });

        it('[Critical] should reset password with valid OTP and Admin token', async () => {
            const adminId = generateId();
            const adminEmail = 'admin@pahadigo.com';
            await User.create({ _id: adminId, email: adminEmail, role: USER_ROLES.ADMIN });
            const req = createMockReq({
                user: { id: adminId.toString(), role: USER_ROLES.ADMIN },
                jsonBody: { otp: '123456', password: 'new' }
            });
            jest.spyOn(OTPService, 'verifyOTP').mockResolvedValue({ otp: '123456' });
            jest.spyOn(AuthService, 'resetPassword').mockResolvedValue(true);

            await AuthController.resetPassword(req);
            expect(AuthService.resetPassword).toHaveBeenCalledWith(adminId, 'new');
        });
    });

    describe('Feature: Token Health', () => {
        it('[Integrity] should verify and refresh valid tokens', async () => {
            const travelerId = generateId();
            await User.create({ _id: travelerId, name: 'U1', role: USER_ROLES.TRAVELLER });
            const token = await generateToken({ id: travelerId, role: USER_ROLES.TRAVELLER });
            
            const req = { headers: { get: (name) => name === 'authorization' ? `Bearer ${token}` : null } };
            const res = await AuthController.verify(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const refreshRes = await AuthController.refresh(req);
            expect(refreshRes.status).toBe(HTTP_STATUS.OK);
        });
    });
});
