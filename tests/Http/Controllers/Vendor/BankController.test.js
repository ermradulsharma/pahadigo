import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Vendor/BusinessService.js', () => ({
    default: {
        getBusinessByUserId: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Vendor/BankService.js', () => ({
    default: {
        syncBankDetails: jest.fn(),
        removeBankDetails: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Events/VendorEvents.js', () => ({
    default: {
        emit: jest.fn()
    }
}));

const { default: BankController } = await import('@/core/Http/Controllers/Vendor/BankController.js');
const { default: BusinessService } = await import('@/core/Services/Vendor/BusinessService.js');
const { default: BankService } = await import('@/core/Services/Vendor/BankService.js');
const { default: VendorEvents } = await import('@/core/Events/VendorEvents.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Vendor BankController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getBankDetails', () => {
        it('should fetch bank details successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockResolvedValue({ bankDetails: { accountNumber: '123' } });

            const response = await BankController.getBankDetails(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.accountNumber).toBe('123');
            expect(BusinessService.getBusinessByUserId).toHaveBeenCalledWith('u1');
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockRejectedValue(new Error('err'));
            const response = await BankController.getBankDetails(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('createBankDetails', () => {
        it('should create bank details successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { accountNumber: '123' };
            BusinessService.getBusinessByUserId.mockResolvedValue({ user: { email: 'a@b.com' } });
            BankService.syncBankDetails.mockResolvedValue({});

            const response = await BankController.createBankDetails(mockReq);
            
            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(BankService.syncBankDetails).toHaveBeenCalledWith('u1', { accountNumber: '123' });
            expect(VendorEvents.emit).toHaveBeenCalledWith('vendor.bank_added', expect.any(Object));
        });

        it('should pass cancelledChequeFile if present in formData', async () => {
            const formDataBody = new Map();
            formDataBody.set('cancelledCheque', 'file_obj');
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { accountNumber: '123' };
            mockReq.formDataBody = formDataBody;

            BusinessService.getBusinessByUserId.mockResolvedValue({});
            BankService.syncBankDetails.mockResolvedValue({});

            const response = await BankController.createBankDetails(mockReq);
            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(BankService.syncBankDetails).toHaveBeenCalledWith('u1', expect.objectContaining({ cancelledChequeFile: 'file_obj' }));
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BankService.syncBankDetails.mockRejectedValue(new Error('err'));
            const response = await BankController.createBankDetails(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('updateBankDetails', () => {
        it('should update bank details successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { accountNumber: '456' };
            BankService.syncBankDetails.mockResolvedValue({});

            const response = await BankController.updateBankDetails(mockReq);
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(BankService.syncBankDetails).toHaveBeenCalledWith('u1', { accountNumber: '456' });
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BankService.syncBankDetails.mockRejectedValue(new Error('err'));
            const response = await BankController.updateBankDetails(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('deleteBankDetails', () => {
        it('should delete bank details successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BankService.removeBankDetails.mockResolvedValue({ bankDetails: {} });

            const response = await BankController.deleteBankDetails(mockReq);
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(BankService.removeBankDetails).toHaveBeenCalledWith('u1');
        });

        it('should handle errors gracefully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BankService.removeBankDetails.mockRejectedValue(new Error('err'));
            const response = await BankController.deleteBankDetails(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });
});
