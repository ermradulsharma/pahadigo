import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Auth/User/OTPService.js', () => ({
    __esModule: true,
    default: {
        verifyOTP: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn()
    }
}));

const mockGenerateAuthTokens = jest.fn().mockResolvedValue({ accessToken: 'access_token', refreshToken: 'refresh_token', refreshJti: 'jti123' });
const mockVerifyToken = jest.fn().mockResolvedValue({ id: 'u1' });
const mockGenerateToken = jest.fn().mockResolvedValue('token');
const mockDecodeToken = jest.fn().mockReturnValue({ id: 'u1' });

jest.unstable_mockModule('@/core/Helpers/jwt.js', () => ({
    generateAuthTokens: mockGenerateAuthTokens,
    generateToken: mockGenerateToken,
    verifyToken: mockVerifyToken,
    decodeToken: mockDecodeToken,
    default: {
        generateAuthTokens: mockGenerateAuthTokens,
        generateToken: mockGenerateToken,
        verifyToken: mockVerifyToken,
        decodeToken: mockDecodeToken
    }
}));

jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    __esModule: true,
    default: {
        set: jest.fn().mockResolvedValue('OK'),
        get: jest.fn().mockResolvedValue(null)
    }
}));

const { default: AuthService } = await import('@/core/Services/Auth/User/AuthService.js');
const { default: OTPService } = await import('@/core/Services/Auth/User/OTPService.js');
const { default: User } = await import('@/core/Models/User.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');

describe('Industry Standard: User AuthService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[authenticateWithOTP]', () => {
        it('[Success] should authenticate existing user and return token', async () => {
            const mockUser = {
                _id: 'u1',
                role: 'traveller',
                isVerified: true,
                save: jest.fn().mockResolvedValue(true),
                isModified: jest.fn().mockReturnValue(false),
                toObject: function() { return this; }
            };

            OTPService.verifyOTP.mockResolvedValue(mockUser);
            User.findOne.mockResolvedValue(mockUser);

            const result = await AuthService.authenticateWithOTP({ identifier: 'test@test.com', otp: '123456', role: 'traveller' });

            expect(result).toBeDefined();
            expect(result.tokens).toBeDefined();
        });

        it('[Success] should create new user if not exists', async () => {
            const mockUser = {
                _id: 'u1',
                role: 'traveller',
                isVerified: false,
                save: jest.fn().mockResolvedValue(true),
                isModified: jest.fn().mockReturnValue(false),
                toObject: function() { return this; }
            };

            OTPService.verifyOTP.mockResolvedValue(mockUser);

            const result = await AuthService.authenticateWithOTP({ identifier: 'new@test.com', otp: '123456', role: 'traveller' });

            expect(result).toBeDefined();
        });
    });
});
