import { jest } from '@jest/globals';

const mockQueryHelpers = {
    getUserById: jest.fn(),
    getBusinessByUserId: jest.fn(),
    getPackageBy: jest.fn(),
    getBusinessById: jest.fn(),
    getBusinessByIdAndUserId: jest.fn()
};

const mockPackageHelpers = {
    itemsFormate: jest.fn()
};

const mockUserProfileHelpers = {
    userPayload: jest.fn(),
    userBusinessPayload: jest.fn()
};

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => mockQueryHelpers);
jest.unstable_mockModule('@/core/Helpers/package.js', () => mockPackageHelpers);
jest.unstable_mockModule('@/core/Helpers/userProfileHelper.js', () => mockUserProfileHelpers);

const { default: VendorController } = await import('@/core/Http/Controllers/Traveller/VendorController.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');

describe('Industry Standard: Traveller VendorController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {};
    });

    it('[getVendorPersonalInfo] should return 404 if user is not found', async () => {
        mockQueryHelpers.getUserById.mockResolvedValue(null);

        const res = await VendorController.getVendorPersonalInfo(mockReq, { params: { userId: 'unknown_u' } });
        expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('[getVendorPersonalInfo] should return userBusinessPayload with items when business exists', async () => {
        const fakeUser = { _id: 'u_101', name: 'Vendor Guide' };
        const fakeBusiness = { _id: 'biz_101', businessName: 'Mountain Travels' };
        mockQueryHelpers.getUserById.mockResolvedValue(fakeUser);
        mockQueryHelpers.getBusinessByUserId.mockResolvedValue(fakeBusiness);
        
        const initialPayload = {
            id: 'u_101',
            name: 'Vendor Guide',
            businessDetails: {
                id: 'biz_101',
                businessName: 'Mountain Travels'
            }
        };
        mockUserProfileHelpers.userBusinessPayload.mockReturnValue(initialPayload);
        mockQueryHelpers.getPackageBy.mockResolvedValue({ homestays: [] });
        mockPackageHelpers.itemsFormate.mockReturnValue([{ id: 'pkg_1', title: 'Camp Site' }]);

        const res = await VendorController.getVendorPersonalInfo(mockReq, { params: { userId: 'u_101' } });
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockQueryHelpers.getUserById).toHaveBeenCalledWith('u_101');
        expect(mockQueryHelpers.getBusinessByUserId).toHaveBeenCalledWith('u_101');
        expect(mockPackageHelpers.itemsFormate).toHaveBeenCalled();
        expect(initialPayload.businessDetails.items).toBeDefined();
    });
});
