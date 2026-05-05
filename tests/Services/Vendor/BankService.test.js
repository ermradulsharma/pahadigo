import { jest } from '@jest/globals';

// Use unstable_mockModule for ESM Helpers
jest.unstable_mockModule('@/core/Helpers/cloudinary.js', () => ({
    uploadToCloudinary: jest.fn()
}));

const { default: BankService } = await import('@/core/Services/Vendor/BankService.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { uploadToCloudinary } = await import('@/core/Helpers/cloudinary.js');

describe('Vendor BankService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Vendor, 'findOne');
        jest.spyOn(Vendor, 'findOneAndUpdate');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('updateBankDetails', () => {
        test('should update bank details without file upload', async () => {
            const userId = 'user123';
            const bankData = { accountHolderName: 'John Doe', accountNumber: '12345' };
            const mockVendor = { _id: 'v1', bankDetails: {} };
            
            Vendor.findOne.mockResolvedValue(mockVendor);
            Vendor.findOneAndUpdate.mockResolvedValue({ bankDetails: bankData });

            const result = await BankService.updateBankDetails(userId, bankData);

            expect(result.accountHolderName).toBe('John Doe');
        });

        test('should update bank details with file upload', async () => {
            const userId = 'user123';
            const bankData = { cancelledChequeFile: { name: 'cheque.jpg' } };
            const mockVendor = { _id: 'v1', bankDetails: {} };
            
            Vendor.findOne.mockResolvedValue(mockVendor);
            uploadToCloudinary.mockResolvedValue({ url: 'http://cloud.com/img', publicId: 'p1' });
            Vendor.findOneAndUpdate.mockResolvedValue({ 
                bankDetails: { cancelledCheque: { url: 'http://cloud.com/img' } } 
            });

            const result = await BankService.updateBankDetails(userId, bankData);

            expect(result.cancelledCheque.url).toBe('http://cloud.com/img');
            expect(uploadToCloudinary).toHaveBeenCalled();
        });
    });

    describe('deleteBankDetails', () => {
        test('should remove bank details', async () => {
            const populateMock = jest.fn().mockResolvedValue({ _id: 'v1' });
            Vendor.findOneAndUpdate.mockReturnValue({
                populate: populateMock
            });

            await BankService.deleteBankDetails('u1');

            expect(Vendor.findOneAndUpdate).toHaveBeenCalledWith(
                { user: 'u1', deletedAt: null },
                { $unset: { bankDetails: "" } },
                expect.anything()
            );
        });
    });
});
