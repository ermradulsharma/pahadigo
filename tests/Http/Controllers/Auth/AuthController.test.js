import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Auth/index.js', () => ({
    AdminAuthService: { authenticateWithPassword: jest.fn(), initiatePasswordReset: jest.fn() },
    UserAuthService: { initiateOTP: jest.fn(), authenticateWithOTP: jest.fn() },
    BaseAuthService: { verifyToken: jest.fn(), getUserProfile: jest.fn() }
}));

jest.unstable_mockModule('@/core/Helpers/parseBody.js', () => ({
    parseBody: jest.fn(),
    default: jest.fn()
}));

jest.unstable_mockModule('@/core/Helpers/validation.js', () => ({
    validate: jest.fn((schema, data) => ({ success: true, data })),
    schemas: { otpSend: {}, otpLogin: {} },
    default: { validate: jest.fn(), schemas: {} }
}));

const { default: AuthController } = await import('@/core/Http/Controllers/Auth/AuthController.js');
const { AdminAuthService, UserAuthService } = await import('@/core/Services/Auth/index.js');

describe('Industry Standard: AuthController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[initiateOTP]', () => {
        it('[Success] should call UserAuthService and return 200', async () => {
            const req = { 
                payload: { email: 'test@test.com', termsAccepted: true, role: 'traveller' },
                headers: { get: jest.fn() }
            };
            UserAuthService.initiateOTP.mockResolvedValue('123456');

            const response = await AuthController.initiateOTP(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.otp).toBe('123456');
            expect(UserAuthService.initiateOTP).toHaveBeenCalled();
        });

        it('[Failure] should return 400 if terms not accepted for vendor', async () => {
            const req = { payload: { email: 'test@test.com', role: 'vendor' } };
            const response = await AuthController.initiateOTP(req);
            expect(response.status).toBe(400);
        });
    });

    describe('[authenticate]', () => {
        it('[Success] should call AdminAuthService with password', async () => {
            const body = { email: 'admin@test.com', password: 'pass' };
            const req = { jsonBody: body, payload: body, headers: { get: jest.fn() } };
            AdminAuthService.authenticateWithPassword.mockResolvedValue({ user: { _id: 'a1' }, token: 'tk' });

            const response = await AuthController.authenticate(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(AdminAuthService.authenticateWithPassword).toHaveBeenCalled();
        });
    });
});
