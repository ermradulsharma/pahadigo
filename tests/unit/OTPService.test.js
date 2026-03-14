import { jest } from '@jest/globals';
import OTPService from '../../src/core/Services/OTPService.js';

describe('OTPService', () => {
    const email = 'test@example.com';

    beforeEach(() => {
        OTPService.otps.clear();
        jest.spyOn(OTPService, '_sendOTP').mockResolvedValue();
    });

    it('should generate an OTP and store it', () => {
        const otp = OTPService.generateOTP(email, 'user');
        expect(otp).toHaveLength(6);

        const record = OTPService.verifyOTP(email, otp);
        expect(record).toBeDefined();
        expect(record.role).toBe('user');
    });

    it('should return null for invalid OTP', () => {
        OTPService.generateOTP(email, 'user');
        const record = OTPService.verifyOTP(email, '000000');
        expect(record).toBeNull();
    });

    it('should return null for expired OTP', () => {
        const otp = OTPService.generateOTP(email, 'user');
        const record = OTPService.otps.get(email);
        record.expiresAt = Date.now() - 1000; // Force expire

        const result = OTPService.verifyOTP(email, otp);
        expect(result).toBeNull();
    });

    it('should support dynamic master OTP from env', () => {
        process.env.MASTER_OTP = '999999';
        const record = OTPService.verifyOTP(email, '999999');
        expect(record).toBeDefined();
        expect(record.role).toBe('master');

        // Ensure old hardcoded bypass no longer functions
        const failedRecord = OTPService.verifyOTP(email, '888888');
        expect(failedRecord).toBeNull();
    });

    it('should delete OTP after successful verification', () => {
        const otp = OTPService.generateOTP(email, 'user');
        OTPService.verifyOTP(email, otp);

        const record = OTPService.otps.get(email);
        expect(record).toBeUndefined();
    });
});
