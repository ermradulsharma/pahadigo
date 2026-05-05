import { jest } from '@jest/globals';
import ProfileController from '@/core/Http/Controllers/Admin/ProfileController.js';
import { BaseAuthService } from '@/core/Services/Auth/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { createMockReq } from '../../../Helpers/testUtils.js';

describe('Admin ProfileController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getProfile', () => {
        test('should return profile for authenticated admin', async () => {
            const mockUser = { id: 'admin123', email: 'admin@test.com' };
            mockReq = createMockReq({ user: { id: 'admin123', role: 'admin' } });
            
            jest.spyOn(BaseAuthService, 'getUserProfile').mockResolvedValue(mockUser);

            const response = await ProfileController.getProfile(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.USER.FETCHED);
            expect(body.data.email).toBe(mockUser.email);
        });

        test('should return unauthorized if no user in request', async () => {
            mockReq = createMockReq({ user: null });

            const response = await ProfileController.getProfile(mockReq);
            
            expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        });
    });

    describe('updateProfile', () => {
        test('should update profile successfully', async () => {
            const mockUser = { id: 'admin123', firstName: 'Updated' };
            mockReq = createMockReq({ 
                user: { id: 'admin123', role: 'admin' },
                jsonBody: { firstName: 'Updated' }
            });

            jest.spyOn(BaseAuthService, 'updateUserProfile').mockResolvedValue(mockUser);

            const response = await ProfileController.updateProfile(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.SUCCESS.PROFILE_UPDATED);
            expect(body.data.firstName).toBe('Updated');
        });

        test('should return 500 on service error', async () => {
            mockReq = createMockReq({ 
                user: { id: 'admin123', role: 'admin' },
                jsonBody: { firstName: 'Updated' }
            });

            jest.spyOn(BaseAuthService, 'updateUserProfile').mockRejectedValue(new Error('DB Error'));

            const response = await ProfileController.updateProfile(mockReq);
            
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });
});
