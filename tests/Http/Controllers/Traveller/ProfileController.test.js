import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Traveller/ProfileService.js', () => ({
    __esModule: true,
    default: {
        getProfile: jest.fn(),
        updateProfile: jest.fn(),
        updateAvatar: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    __esModule: true,
    default: {
        findByIdAndUpdate: jest.fn()
    }
}));

const { default: ProfileController } = await import('@/core/Http/Controllers/Traveller/ProfileController.js');
const { default: ProfileService } = await import('@/core/Services/Traveller/ProfileService.js');
const { default: User } = await import('@/core/Models/User.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Traveller ProfileController Unit Tests', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getProfile', () => {
        it('should return profile of logged-in traveller', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            ProfileService.getProfile.mockResolvedValue({ _id: 'u123', name: 'Rahul Sharma', email: 'rahul@test.com' });

            const response = await ProfileController.getProfile(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.user.name).toBe('Rahul Sharma');
        });
    });

    describe('updateProfile', () => {
        it('should update traveller profile details', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            mockReq.payload = { name: 'Rahul S.' };

            ProfileService.updateProfile.mockResolvedValue({ _id: 'u123', name: 'Rahul S.' });

            const response = await ProfileController.updateProfile(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.user.name).toBe('Rahul S.');
        });
    });

    describe('updateFCMToken', () => {
        it('should update device FCM token for push notifications', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            mockReq.payload = { fcmToken: 'fcm_token_xyz' };

            User.findByIdAndUpdate.mockReturnValue({
                select: jest.fn().mockResolvedValue({ _id: 'u123', fcmToken: 'fcm_token_xyz' })
            });

            const response = await ProfileController.updateFCMToken(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.fcmToken).toBe('fcm_token_xyz');
        });
    });
});
