import PackageController from '@/core/Http/Controllers/Admin/PackageController';
import PackageService from '@/core/Services/Admin/PackageService';
import { jest } from '@jest/globals';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants';

describe('PackageController: updateServiceStatus tests', () => {
    let mockReq;
    let mockParams;

    beforeEach(() => {
        jest.clearAllMocks();
        mockParams = { id: '69d8d1862cb6971e2e32781e' };
        mockReq = {
            payload: {
                vendorId: '69d8cf957ba7098746d85a45',
                userId: '69d8cf697ba7098746d85a44',
                status: true,
                serviceType: 'vehicleRental'
            }
        };
        
        // Mock Controller success/error methods if they aren't working as expected in the test env
        // Note: In some systems, these are inherited from a BaseController
        if (!PackageController.success) PackageController.success = jest.fn((status, message, data) => ({ status, message, data }));
        if (!PackageController.error) PackageController.error = jest.fn((status, message) => ({ status, message }));
        
        // Silence console.error during tests to avoid confusing logs for expected error handles
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('[Success] should return OK when status is updated', async () => {
        const mockUpdatedItem = { _id: '123', isActive: true };
        jest.spyOn(PackageService, 'toggleServiceStatus').mockResolvedValue(mockUpdatedItem);

        const response = await PackageController.updateServiceStatus(mockReq, { params: mockParams });

        expect(PackageService.toggleServiceStatus).toHaveBeenCalled();
        expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it('[Validation] should return BAD_REQUEST if status is missing', async () => {
        delete mockReq.payload.status;
        const errorSpy = jest.spyOn(PackageController, 'error');

        await PackageController.updateServiceStatus(mockReq, { params: mockParams });

        expect(errorSpy).toHaveBeenCalledWith(
            HTTP_STATUS.BAD_REQUEST, 
            RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS
        );
    });

    it('[Error] should handle service layer errors', async () => {
        const errorMsg = "Internal Error";
        jest.spyOn(PackageService, 'toggleServiceStatus').mockRejectedValue(new Error(errorMsg));
        const errorSpy = jest.spyOn(PackageController, 'error');

        await PackageController.updateServiceStatus(mockReq, { params: mockParams });

        expect(errorSpy).toHaveBeenCalledWith(
            HTTP_STATUS.INTERNAL_SERVER_ERROR, 
            errorMsg
        );
    });
});
