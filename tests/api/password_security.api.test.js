import AuthController from '../../src/core/Http/Controllers/AuthController.js';
import AuthService from '../../src/core/Services/AuthService.js';
import OTPService from '../../src/core/Services/OTPService.js';
import User from '../../src/core/Models/User.js';
import { createMockReq, cleanDatabase, generateId } from '../helpers/testUtils.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, USER_ROLES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('API Security: Password Workflows', () => {
  let adminId;
  let travelerId;

  beforeEach(async () => {
    await cleanDatabase();
    adminId = generateId();
    travelerId = generateId();
    jest.clearAllMocks();
  });

  describe('Feature: Password Reset (Admin Only + OTP)', () => {

    it('[Security] should block unauthorized role from accessing reset-password', async () => {
      // Create a traveler in the database
      await User.create({ _id: travelerId, name: 'Test Traveler', role: USER_ROLES.TRAVELLER });

      const req = createMockReq({
        user: { id: travelerId.toString(), role: USER_ROLES.TRAVELLER },
        jsonBody: { otp: '123456', password: 'newSecurePassword123' }
      });

      const res = await AuthController.resetPassword(req);
      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('[Validation] should fail reset-password if OTP is missing', async () => {
      const req = createMockReq({
        user: { id: adminId.toString(), role: USER_ROLES.ADMIN },
        jsonBody: { password: 'newSecurePassword123' }
      });

      const res = await AuthController.resetPassword(req);
      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('[Critical] should successfully reset password with valid OTP and Admin token', async () => {
      const adminEmail = 'admin@pahadigo.com';
      await User.create({ _id: adminId, email: adminEmail, role: USER_ROLES.ADMIN });

      const req = createMockReq({
        user: { id: adminId.toString(), role: USER_ROLES.ADMIN },
        jsonBody: { otp: '123456', password: 'newSecurePassword123' }
      });

      // Mock OTP verification success
      jest.spyOn(OTPService, 'verifyOTP').mockResolvedValue({ otp: '123456' });
      jest.spyOn(AuthService, 'resetPassword').mockResolvedValue(true);

      const res = await AuthController.resetPassword(req);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(OTPService.verifyOTP).toHaveBeenCalledWith(adminEmail, '123456');
      expect(AuthService.resetPassword).toHaveBeenCalledWith(adminId, 'newSecurePassword123');
    });

    it('[Security] should block reset if OTP is invalid', async () => {
      await User.create({ _id: adminId, email: 'admin@pahadigo.com', role: USER_ROLES.ADMIN });
      const req = createMockReq({
        user: { id: adminId.toString(), role: USER_ROLES.ADMIN },
        jsonBody: { otp: '000000', password: 'newSecurePassword123' }
      });

      jest.spyOn(OTPService, 'verifyOTP').mockResolvedValue(null);
      const res = await AuthController.resetPassword(req);

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(AuthService.resetPassword).not.toHaveBeenCalled();
    });
  });

  describe('Feature: Change Password (Admin Only + Old Password)', () => {

    it('[Success] should change password for admin with valid old password', async () => {
      const adminEmail = 'admin@pahadigo.com';
      const mockAdmin = {
        _id: adminId,
        email: adminEmail,
        role: USER_ROLES.ADMIN,
        comparePassword: jest.fn().mockResolvedValue(true)
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      const req = createMockReq({
        user: { id: adminId.toString(), role: USER_ROLES.ADMIN },
        jsonBody: { oldPassword: 'oldSecret', newPassword: 'newSecret' }
      });

      jest.spyOn(AuthService, 'changePassword').mockResolvedValue(true);

      const res = await AuthController.changePassword(req);
      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(AuthService.changePassword).toHaveBeenCalledWith(adminId, 'newSecret');
    });

    it('[Security] should block change password if old password mismatches', async () => {
      const mockAdmin = {
        _id: adminId,
        role: USER_ROLES.ADMIN,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      jest.spyOn(User, 'findById').mockReturnValue({
        select: jest.fn().mockResolvedValue(mockAdmin)
      });

      const req = createMockReq({
        user: { id: adminId.toString(), role: USER_ROLES.ADMIN },
        jsonBody: { oldPassword: 'wrongOldSecret', newPassword: 'newSecret' }
      });

      const res = await AuthController.changePassword(req);
      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(AuthService.changePassword).not.toHaveBeenCalled();
    });
  });
});
