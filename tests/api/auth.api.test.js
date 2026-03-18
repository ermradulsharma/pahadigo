import AuthController from '../../src/core/Http/Controllers/AuthController.js';
import User from '../../src/core/Models/User.js';
import { USER_ROLES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import AuthService from '../../src/core/Services/AuthService.js';
import * as cloudinary from '../../src/core/Helpers/cloudinary.js';
import mongoose from 'mongoose';

describe('Auth API Integration (Controller Layer)', () => {
    let mockReq;
    beforeEach(() => {
        mockReq = {
            jsonBody: {},
            headers: new Map(),
            user: null
        };
        mockReq.headers.set = function(k, v) { this[k.toLowerCase()] = v; };
        mockReq.headers.get = function(k) { return this[k.toLowerCase()]; };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendOtp', () => {
        it('should send an OTP successfully via email', async () => {
            const req = { jsonBody: { email: 'test@example.com', role: USER_ROLES.TRAVELLER } };
            const response = await AuthController.sendOtp(req);
            expect(response.status).toBe(200);
        });

        it('should send an OTP successfully via phone', async () => {
            const req = { jsonBody: { phone: '9876543210' } };
            const response = await AuthController.sendOtp(req);
            expect(response.status).toBe(200);
        });

        it('should return error for invalid email format', async () => {
            const req = { jsonBody: { email: 'invalid-email', role: USER_ROLES.TRAVELLER } };
            const response = await AuthController.sendOtp(req);
            expect(response.status).toBe(400);
        });

        it('should block OTP for empty email string passed explicitly', async () => {
            const req = { jsonBody: { email: '' } };
            const response = await AuthController.sendOtp(req);
            expect(response.status).toBe(400);
        });

        it('should block OTP for empty phone string passed explicitly', async () => {
            const req = { jsonBody: { phone: '' } };
            const response = await AuthController.sendOtp(req);
            expect(response.status).toBe(400);
        });

        it('should block OTP if neither email nor phone provided', async () => {
            const req = { jsonBody: {} };
            const response = await AuthController.sendOtp(req);
            expect(response.status).toBe(400);
        });

        it('should block OTP for invalid role', async () => {
            const req = { jsonBody: { email: 'test2@test.com', role: 'invalid_role' } };
            const response = await AuthController.sendOtp(req);
            expect(response.status).toBe(400);
        });

        it('should strictly block admins from getting OTP', async () => {
            await User.create({ email: 'admin_otp@test.com', role: 'admin' });
            const req = { jsonBody: { email: 'admin_otp@test.com' } };
            const response = await AuthController.sendOtp(req);
            expect(response.status).toBe(403);
        });

        it('should return 500 on internal errors', async () => {
            const req = { get jsonBody() { throw new Error('Parse error'); } };
            const response = await AuthController.sendOtp(req);
            expect(response.status).toBe(500);
        });
    });

    describe('login (Password)', () => {
        it('should successfully login an admin', async () => {
             const user = await User.create({ email: 'admin_login@test.com', role: 'admin' });
             user.password = 'Pass123!';
             await user.save();
             
             const req = { jsonBody: { email: 'admin_login@test.com', password: 'Pass123!' } };
             const response = await AuthController.login(req);
             expect(response.status).toBe(200);
             const data = await response.json();
             expect(data.data.token).toBeDefined();
        });

        it('should fail on wrong credentials', async () => {
             const req = { jsonBody: { email: 'admin_login@test.com', password: 'WrongPass' } };
             const response = await AuthController.login(req);
             expect(response.status).toBe(401);
        });
    });

    describe('verifyOtp', () => {
        it('should successfully verify Otp using MASTER_OTP', async () => {
            process.env.MASTER_OTP = '123456';
            const req = { jsonBody: { identifier: 'master@test.com', otp: '123456' } };
            const response = await AuthController.verifyOtp(req);
            expect(response.status).toBe(200);
            process.env.MASTER_OTP = undefined;
        });

        it('should fail verify with wrong OTP', async () => {
            const req = { jsonBody: { identifier: 'test@example.com', otp: '000000' } };
            const response = await AuthController.verifyOtp(req);
            expect(response.status).toBe(400);
        });

        it('should catch different method error', async () => {
            await User.create({ email: 'admin_verify@test.com', role: 'admin' });
            process.env.MASTER_OTP = '123456';
            const req = { jsonBody: { identifier: 'admin_verify@test.com', otp: '123456' } };
            const response = await AuthController.verifyOtp(req);
            expect(response.status).toBe(403);
            process.env.MASTER_OTP = undefined;
        });

        it('should return 500 on internal errors', async () => {
            const req = { get jsonBody() { throw new Error('Some internal error'); } };
            const response = await AuthController.verifyOtp(req);
            expect(response.status).toBe(500);
        });
    });

    describe('Social Logins', () => {
        it('googleLogin requires idToken', async () => {
            const req = { jsonBody: {} };
            const res = await AuthController.googleLogin(req);
            expect(res.status).toBe(400);
        });
        
        it('googleLogin handles errors properly', async () => {
            const req = { jsonBody: { idToken: 'fake' } };
            jest.spyOn(AuthService, 'googleAuth').mockRejectedValue(new Error('Auth failed'));
            const res = await AuthController.googleLogin(req);
            expect(res.status).toBe(500);
        });

        it('facebookLogin requires accessToken', async () => {
            const req = { jsonBody: {} };
            const res = await AuthController.facebookLogin(req);
            expect(res.status).toBe(400);
        });

        it('facebookLogin handles errors', async () => {
             const req = { jsonBody: { accessToken: 'fake' } };
             jest.spyOn(AuthService, 'facebookAuth').mockRejectedValue(new Error('FB fail'));
             const res = await AuthController.facebookLogin(req);
             expect(res.status).toBe(500);
        });

        it('appleLogin requires idToken', async () => {
             const req = { jsonBody: {} };
             const res = await AuthController.appleLogin(req);
             expect(res.status).toBe(400);
        });

        it('appleLogin handles errors', async () => {
             const req = { jsonBody: { idToken: 'fake' } };
             jest.spyOn(AuthService, 'appleAuth').mockRejectedValue(new Error('Apple fail'));
             const res = await AuthController.appleLogin(req);
             expect(res.status).toBe(500);
        });
    });

    describe('JWT Verification & Refresh', () => {
        it('verify requires token', async () => {
            const res = await AuthController.verify(mockReq);
            expect(res.status).toBe(401);
        });

        it('verify handles valid token', async () => {
            mockReq.headers.set('authorization', 'Bearer fake_token');
            jest.spyOn(AuthService, 'verify').mockResolvedValue({ user: { email: 't@t.c' } });
            const res = await AuthController.verify(mockReq);
            expect(res.status).toBe(200);
        });

        it('refresh requires token', async () => {
             const res = await AuthController.refresh(mockReq);
             expect(res.status).toBe(401);
        });

        it('refresh handles valid token', async () => {
            mockReq.headers.set('authorization', 'Bearer fake_token');
            jest.spyOn(AuthService, 'refresh').mockResolvedValue({ token: 'new_token' });
            const res = await AuthController.refresh(mockReq);
            expect(res.status).toBe(200);
        });

        it('me requires token if no req.user', async () => {
            const res = await AuthController.me(mockReq);
            expect(res.status).toBe(401);
        });

        it('me uses req.user if available', async () => {
             mockReq.user = { id: new mongoose.Types.ObjectId() };
             jest.spyOn(AuthService, 'getProfileById').mockResolvedValue({ email: 't@t.c' });
             const res = await AuthController.me(mockReq);
             expect(res.status).toBe(200);
        });
    });

    describe('Password and Profile Mgmt', () => {
        it('forgetPassword requires email', async () => {
             const res = await AuthController.forgetPassword({ jsonBody: {} });
             expect(res.status).toBe(400);
        });

        it('forgetPassword succeeds', async () => {
             jest.spyOn(AuthService, 'forgetPassword').mockResolvedValue(true);
             const res = await AuthController.forgetPassword({ jsonBody: { email: 't@t.c' } });
             expect(res.status).toBe(200);
        });

        it('resetPassword requires fields', async () => {
             const res = await AuthController.resetPassword({ jsonBody: {} });
             expect(res.status).toBe(400);
        });

        it('resetPassword succeeds', async () => {
             jest.spyOn(AuthService, 'resetPassword').mockResolvedValue(true);
             const res = await AuthController.resetPassword({ jsonBody: { email: 't@t.c', password: 'new' } });
             expect(res.status).toBe(200);
        });

        it('changePassword requires all fields', async () => {
            const res = await AuthController.changePassword({ jsonBody: { email: 't' } });
            expect(res.status).toBe(400);
        });

        it('changePassword fails if user not found', async () => {
             const res = await AuthController.changePassword({ jsonBody: { email: 'not_found@t.c', oldPassword: '1', newPassword: '2' } });
             expect(res.status).toBe(404);
        });

        it('changePassword rejects wrong old password', async () => {
             const user = await User.create({ email: 'change@test.com', role: 'admin' });
             user.password = '123';
             await user.save();
             const res = await AuthController.changePassword({ jsonBody: { email: 'change@test.com', oldPassword: 'Wrong', newPassword: 'New' } });
             expect(res.status).toBe(400);
        });

        it('updateProfile requires auth', async () => {
             const res = await AuthController.updateProfile(mockReq);
             expect(res.status).toBe(401);
        });

        it('updateProfile handles json body', async () => {
             mockReq.user = { id: new mongoose.Types.ObjectId() };
             mockReq.jsonBody = { name: 'New Name', role: 'admin' }; // role should be ignored
             jest.spyOn(AuthService, 'updateProfileById').mockResolvedValue({ name: 'New Name' });
             const res = await AuthController.updateProfile(mockReq);
             expect(res.status).toBe(200);
        });

        it('deleteProfile requires auth', async () => {
             const res = await AuthController.deleteProfile(mockReq);
             expect(res.status).toBe(401);
        });

        it('deleteProfile succeeds', async () => {
             mockReq.user = { id: new mongoose.Types.ObjectId() };
             mockReq.jsonBody = { reason: 'Quit' };
             jest.spyOn(AuthService, 'deleteProfileById').mockResolvedValue(true);
             const res = await AuthController.deleteProfile(mockReq);
             expect(res.status).toBe(200);
        });
        
        it('logout/logoutAll return 200', async () => {
            expect((await AuthController.logout()).status).toBe(200);
            expect((await AuthController.logoutAll()).status).toBe(200);
        });
    });
});
