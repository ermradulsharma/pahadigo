const AuthController = require('../../src/controllers/AuthController');
const User = require('../../src/models/User');

describe('Auth API Integration', () => {
    it('should send an OTP successfully', async () => {
        const req = {
            json: async () => ({ email: 'test@example.com', role: 'user' })
        };

        const response = await AuthController.sendOtp(req);
        expect(response.status).toBe(200);
        expect(response.data.message).toBe('OTP sent successfully');
    });

    it('should fail verify with wrong OTP', async () => {
        const req = {
            json: async () => ({ email: 'test@example.com', otp: '000000' })
        };

        const response = await AuthController.verifyOtp(req);
        expect(response.status).toBe(400);
        expect(response.data.error).toBe('Invalid or expired OTP');
    });

    it('should return error for invalid email format', async () => {
        const req = {
            json: async () => ({ email: 'invalid-email', role: 'user' })
        };

        const response = await AuthController.sendOtp(req);
        expect(response.status).toBe(400);
        expect(response.data.error).toBe('Invalid email format');
    });
});
