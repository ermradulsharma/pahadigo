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

    it('should successfully complete login flow and issue JWT token', async () => {
        const email = 'fullauth@example.com';
        await AuthController.sendOtp({ jsonBody: { email, role: USER_ROLES.TRAVELLER } });

        // We know from OTPService tests that this goes to temporary storage but we'll use a mocked env OTP for speed
        process.env.MASTER_OTP = '112233';

        const req = {
            jsonBody: { email, otp: '112233' }
        };

        const response = await AuthController.verifyOtp(req);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.message).toBe('Verified successfully');
        expect(data.data.token).toBeDefined(); // Token issuance verification
        expect(typeof data.data.token).toBe('string');
    });
});
