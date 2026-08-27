import { jest } from '@jest/globals';

// Use unstable_mockModule for ESM Libs
jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({ secrets: { master_otp: '999999' } })
}));

const { default: OTPService } = await import('@/core/Services/Auth/User/OTPService.js');
const { default: User } = await import('@/core/Models/User.js');
const { default: AuthEvents } = await import('@/core/Events/AuthEvents.js');

describe('User OTPService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(User, 'findOneAndUpdate');
        jest.spyOn(User, 'findOne');
        jest.spyOn(AuthEvents, 'emit').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('generateOTP', () => {
        test('should generate and save OTP for email', async () => {
            const identifier = 'test@test.com';
            User.findOneAndUpdate.mockResolvedValue({ _id: 'u1', otp: '123456' });

            const otp = await OTPService.generateOTP(identifier);

            expect(otp).toHaveLength(6);
            expect(User.findOneAndUpdate).toHaveBeenCalledWith(
                { $or: [{ email: identifier }, { phone: identifier }] },
                expect.objectContaining({ $set: expect.objectContaining({ email: identifier }) }),
                expect.anything()
            );
            expect(AuthEvents.emit).toHaveBeenCalledWith('otp.requested', expect.objectContaining({ identifier }));
        });
    });

    describe('verifyOTP', () => {
        test('should verify master OTP successfully', async () => {
            const identifier = 'test@test.com';
            const mockUser = { 
                _id: 'u1',
                save: jest.fn().mockResolvedValue(true)
            };
            User.findOne.mockResolvedValue(mockUser);

            const result = await OTPService.verifyOTP(identifier, '999999');

            expect(result).toBe(mockUser);
        });

        test('should verify valid user OTP and clear it', async () => {
            const identifier = 'test@test.com';
            const mockUser = { 
                _id: 'u1', 
                otp: '123456', 
                save: jest.fn().mockResolvedValue(true) 
            };
            User.findOne.mockResolvedValue(mockUser);

            const result = await OTPService.verifyOTP(identifier, '123456');

            expect(result).toBe(mockUser);
            expect(mockUser.otp).toBe(null);
            expect(mockUser.save).toHaveBeenCalled();
        });
    });
});
