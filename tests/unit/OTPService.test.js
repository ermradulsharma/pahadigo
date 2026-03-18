import { jest } from '@jest/globals';
import OTPService from '../../src/core/Services/OTPService.js';
import User from '../../src/core/Models/User.js';

describe('OTPService', () => {
    const email = 'test@example.com';

    beforeAll(async () => {
        // Clear users before tests
        await User.deleteMany({});
    });

    beforeEach(async () => {
        await User.deleteMany({});
        jest.spyOn(OTPService, '_sendOTP').mockResolvedValue();
    });

    it('should generate an OTP and store it', async () => {
        const otp = await OTPService.generateOTP(email, 'traveller');
        expect(otp).toHaveLength(6);

        const record = await OTPService.verifyOTP(email, otp);
        expect(record).toBeDefined();
        expect(record.role).toBe('traveller');
    });

    it('should return null for invalid OTP', async () => {
        await OTPService.generateOTP(email, 'traveller');
        const record = await OTPService.verifyOTP(email, '000000');
        expect(record).toBeNull();
    });

    it('should return null for expired OTP', async () => {
        const otp = await OTPService.generateOTP(email, 'traveller');
        
        // Force expire
        await User.updateOne({ email }, { $set: { otpExpires: new Date(Date.now() - 1000) } });

        const result = await OTPService.verifyOTP(email, otp);
        expect(result).toBeNull();
    });

    it('should support dynamic master OTP from env', async () => {
        process.env.MASTER_OTP = '999999';
        const record = await OTPService.verifyOTP(email, '999999');
        expect(record).toBeDefined();
        expect(record.role).toBe('master');

        // Ensure old hardcoded bypass no longer functions if we send another
        const failedRecord = await OTPService.verifyOTP(email, '888888');
        expect(failedRecord).toBeNull();
    });

    it('should delete OTP after successful verification', async () => {
        const otp = await OTPService.generateOTP(email, 'traveller');
        await OTPService.verifyOTP(email, otp);

        const user = await User.findOne({ email });
        expect(user.otp).toBeUndefined();
    });
});
