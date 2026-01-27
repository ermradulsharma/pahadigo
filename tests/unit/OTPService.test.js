import OTPService from '../../src/services/OTPService.js';

describe('OTPService', () => {
    const email = 'test@example.com';

    beforeEach(() => {
        OTPService.otps.clear();
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

    it('should support master OTP', () => {
        const masterOtp = '888888';
        const record = OTPService.verifyOTP(email, masterOtp);
        expect(record).toBeDefined();
        expect(record.role).toBe('master');
    });

    it('should delete OTP after successful verification', () => {
        const otp = OTPService.generateOTP(email, 'user');
        OTPService.verifyOTP(email, otp);

        const record = OTPService.otps.get(email);
        expect(record).toBeUndefined();
    });
});
