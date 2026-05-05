import { jest } from '@jest/globals';
import SettingsController from '@/core/Http/Controllers/Admin/SettingsController.js';
import SettingsService from '@/core/Services/Admin/SettingsService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { createMockReq } from '../../../Helpers/testUtils.js';

describe('Admin SettingsController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getSettings', () => {
        test('should return system settings', async () => {
            const mockSettings = { platformName: 'Pahadigo' };
            mockReq = createMockReq({ user: { role: 'admin' } });
            
            jest.spyOn(SettingsService, 'getSettings').mockResolvedValue(mockSettings);

            const response = await SettingsController.getSettings(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual(mockSettings);
        });
    });

    describe('updateSettings', () => {
        test('should update settings successfully', async () => {
            const mockSettings = { platformName: 'New Name' };
            mockReq = createMockReq({ 
                user: { role: 'admin' },
                jsonBody: { platformName: 'New Name' }
            });
            mockReq.payload = { platformName: 'New Name' };

            jest.spyOn(SettingsService, 'updateSettings').mockResolvedValue(mockSettings);

            const response = await SettingsController.updateSettings(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.SUCCESS.UPDATED);
            expect(body.data).toEqual(mockSettings);
        });

        test('should return 400 on service error', async () => {
            mockReq = createMockReq({ 
                user: { role: 'admin' },
                jsonBody: { platformName: 'New Name' }
            });
            mockReq.payload = { platformName: 'New Name' };

            jest.spyOn(SettingsService, 'updateSettings').mockRejectedValue(new Error('Validation failed'));

            const response = await SettingsController.updateSettings(mockReq);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });
});
