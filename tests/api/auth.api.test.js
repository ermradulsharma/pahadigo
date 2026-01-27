import AuthController from '../../src/controllers/AuthController.js';
import User from '../../src/models/User.js';
import { USER_ROLES } from '../../src/constants/index.js';

describe('Auth API Integration', () => {
    it('should send an OTP successfully', async () => {
        const req = {
            jsonBody: { email: 'test@example.com', role: USER_ROLES.TRAVELLER }
        };

        const response = await AuthController.sendOtp(req);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('OTP sent successfully');
    });

    it('should fail verify with wrong OTP', async () => {
        const req = {
            jsonBody: { email: 'test@example.com', otp: '000000' }
        };

        const response = await AuthController.verifyOtp(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBe('Invalid or expired OTP');
    });

    it('should return error for invalid email format', async () => {
        const req = {
            jsonBody: { email: 'invalid-email', role: USER_ROLES.TRAVELLER }
        };

        const response = await AuthController.sendOtp(req);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.message).toBe('Invalid email format');
    });
});
