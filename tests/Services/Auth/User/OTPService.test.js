import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {
        findOneAndUpdate: jest.fn(),
        findOne: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Events/AuthEvents.js', () => ({
    default: { emit: jest.fn() }
}));

jest.unstable_mockModule('@/lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({ secrets: { master_otp: '888888' } })
}));

const { default: OTPService } = await import('@/services/Auth/User/OTPService.js');
const { default: User } = await import('@/core/Models/User.js');
const { default: AuthEvents } = await import('@/core/Events/AuthEvents.js');

describe('Industry Standard: OTPService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[generateOTP]', () => {
        it('[Success] should generate 6-digit OTP and emit event', async () => {
            const identifier = 'test@test.com';
            User.findOneAndUpdate.mockResolvedValue({ _id: 'u1', email: identifier });

            const otp = await OTPService.generateOTP(identifier);

            expect(otp).toHaveLength(6);
            expect(User.findOneAndUpdate).toHaveBeenCalled();
            expect(AuthEvents.emit).toHaveBeenCalledWith('otp.requested', { identifier, otp });
        });
    });

    describe('[verifyOTP]', () => {
        it('[Success] should verify correct OTP', async () => {
            const identifier = '9876543210';
            const user = { _id: 'u1', otp: '123456', save: jest.fn() };
            User.findOne.mockResolvedValue(user);

            const result = await OTPService.verifyOTP(identifier, '123456');

            expect(result).toEqual(user);
            expect(user.save).toHaveBeenCalled();
        });

        it('[Success] should verify master OTP', async () => {
            const identifier = '9876543210';
            const user = { _id: 'u1' };
            User.findOne.mockResolvedValue(user);

            const result = await OTPService.verifyOTP(identifier, '888888');

            expect(result).toEqual(user);
        });

        it('[Failure] should return null for invalid OTP', async () => {
            User.findOne.mockResolvedValue(null);
            const result = await OTPService.verifyOTP('9876543210', '000000');
            expect(result).toBeNull();
        });
    });
});
