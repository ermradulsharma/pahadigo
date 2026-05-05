import { jest } from '@jest/globals';
import ProfileController from '@/core/Http/Controllers/Vendor/ProfileController.js';
import User from '@/core/Models/User.js';
import { BaseAuthService } from '@/core/Services/Auth/index.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, STATUS } from '@/core/Constants/index.js';
import { createMockReq } from '../../../Helpers/testUtils.js';

describe('Vendor ProfileController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getProfile', () => {
        test('should return profile for authenticated vendor', async () => {
            const mockUser = { id: 'vendor123', firstName: 'Vendor' };
            mockReq = createMockReq({ user: { id: 'vendor123', role: 'vendor' } });
            
            jest.spyOn(BaseAuthService, 'getUserProfile').mockResolvedValue(mockUser);

            const response = await ProfileController.getProfile(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.firstName).toBe('Vendor');
        });
    });

    describe('toggleAccountStatus', () => {
        test('should toggle account status successfully', async () => {
            const mockUser = { 
                id: 'vendor123', 
                status: STATUS.ACTIVE, 
                isVerified: true,
                save: jest.fn().mockResolvedValue(true) 
            };
            mockReq = createMockReq({ 
                user: { id: 'vendor123', role: 'vendor' },
                jsonBody: { status: false }
            });
            // Manual mock for req.payload because createMockReq doesn't set it automatically if we don't use the actual middleware
            mockReq.payload = { status: false };

            jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

            const response = await ProfileController.toggleAccountStatus(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(mockUser.status).toBe(STATUS.INACTIVE);
        });

        test('should return 400 for invalid status type', async () => {
            mockReq = createMockReq({ 
                user: { id: 'vendor123', role: 'vendor' },
                jsonBody: { status: 'invalid' }
            });
            mockReq.payload = { status: 'invalid' };

            const response = await ProfileController.toggleAccountStatus(mockReq);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('updateProfile', () => {
        test('should update allowed fields', async () => {
            const mockUser = { id: 'vendor123', bio: 'Updated bio' };
            mockReq = createMockReq({ 
                user: { id: 'vendor123', role: 'vendor' },
                jsonBody: { bio: 'Updated bio', isAdmin: true } // isAdmin should be ignored
            });
            mockReq.payload = { bio: 'Updated bio', isAdmin: true };

            const findAndUpdateSpy = jest.spyOn(User, 'findByIdAndUpdate').mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            const response = await ProfileController.updateProfile(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(findAndUpdateSpy).toHaveBeenCalledWith(
                'vendor123',
                expect.objectContaining({ $set: { bio: 'Updated bio' } }),
                expect.anything()
            );
        });
    });
});
