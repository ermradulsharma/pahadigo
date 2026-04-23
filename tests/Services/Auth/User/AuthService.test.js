import { jest } from '@jest/globals';

jest.unstable_mockModule('@/models/User.js', () => ({
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn()
    }
}));

jest.unstable_mockModule('@/models/Vendor.js', () => ({
    default: { findOne: jest.fn() }
}));

jest.unstable_mockModule('@/services/Auth/User/OTPService.js', () => ({
    default: {
        generateOTP: jest.fn(),
        verifyOTP: jest.fn()
    }
}));

jest.unstable_mockModule('@/helpers/jwt.js', () => ({
    generateToken: jest.fn()
}));

const { default: AuthService } = await import('@/services/Auth/User/AuthService.js');
const { default: User } = await import('@/models/User.js');
const { default: Vendor } = await import('@/models/Vendor.js');
const { default: OTPService } = await import('@/services/Auth/User/OTPService.js');
const { generateToken } = await import('@/helpers/jwt.js');

describe('Industry Standard: User AuthService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[initiateOTP]', () => {
        it('[Success] should initiate OTP for valid user', async () => {
            User.findOne.mockResolvedValue(null);
            OTPService.generateOTP.mockResolvedValue({ success: true });

            const result = await AuthService.initiateOTP({ identifier: 'test@test.com' });
            
            expect(OTPService.generateOTP).toHaveBeenCalledWith('test@test.com', undefined, { termsAccepted: undefined });
            expect(result.success).toBe(true);
        });

        it('[Failure] should block admin from OTP login', async () => {
            User.findOne.mockResolvedValue({ role: 'admin' });
            await expect(AuthService.initiateOTP({ identifier: 'admin@test.com' }))
                .rejects.toThrow();
        });
    });

    describe('[authenticateWithOTP]', () => {
        it('[Success] should authenticate existing user and return token', async () => {
            const identifier = '9876543210';
            OTPService.verifyOTP.mockResolvedValue({ termsAccepted: 'true' });
            User.findOne.mockResolvedValue({ _id: 'u1', role: 'traveller', isModified: () => false });
            generateToken.mockResolvedValue('mock-token');

            const result = await AuthService.authenticateWithOTP({ identifier, otp: '123456' });

            expect(result.token).toBe('mock-token');
            expect(result.role).toBe('traveller');
        });

        it('[Success] should create new user if not exists', async () => {
            const identifier = 'new@test.com';
            OTPService.verifyOTP.mockResolvedValue({ role: 'traveller' });
            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue({ _id: 'unew', role: 'traveller', email: identifier });
            generateToken.mockResolvedValue('new-token');

            const result = await AuthService.authenticateWithOTP({ identifier, otp: '123456' });

            expect(User.create).toHaveBeenCalled();
            expect(result.isNewUser).toBe(true);
        });
    });

    describe('[toggleRole]', () => {
        it('[Success] should switch role and return new status', async () => {
            const user = { _id: 'u1', role: 'traveller', save: jest.fn(), toObject: () => ({ role: 'traveller' }) };
            User.findById.mockResolvedValue(user);
            Vendor.findOne.mockResolvedValue(null);

            const result = await AuthService.toggleRole('u1');

            expect(user.role).toBe('vendor');
            expect(user.save).toHaveBeenCalled();
            expect(result.role).toBe('vendor');
        });
    });
});
