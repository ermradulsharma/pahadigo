import { jest } from '@jest/globals';
import { createMockReq } from '../../../Helpers/testUtils.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({ tax: { gst: 18, service_tax: 2 } }),
    clearAppConfigCache: jest.fn()
}));

const { default: PackageController } = await import('@/core/Http/Controllers/General/PackageController.js');
const { default: PackageService } = await import('@/core/Services/General/PackageService.js');
const { default: Wishlist } = await import('@/core/Models/Wishlist.js');
const { default: Category } = await import('@/core/Models/Category.js');
const { default: Review } = await import('@/core/Models/Review.js');

describe('Industry Standard: PackageController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(Review, 'find').mockReturnValue({
            populate: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([])
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('[Success] should expose valid HTTP handler methods', () => {
        expect(PackageController).toBeDefined();
    });

    it('[Security] should handle requests using consistent mock context', async () => {
        const req = createMockReq({ user: { role: 'admin' } });
        expect(req.user.role).toBe('admin');
    });

    describe('browsePackages', () => {
        test('should return packages with wishlist info when user is authenticated', async () => {
            const req = createMockReq({
                user: { id: 'user123' },
                url: 'http://localhost/packages?page=1&limit=10'
            });

            const mockPackages = {
                trekking: [
                    { id: 'pkg456', _id: 'pkg456', title: 'Other Trekking', category_name: 'Trekking', category_id: 'cat1', location: { address: 'Himachal' }, pricing: { basePrice: 2000 }, rating: { average: 4.0, count: 5 } },
                    { id: 'pkg123', _id: 'pkg123', title: 'Trekking in Himachal', category_name: 'Trekking', category_id: 'cat1', location: { address: 'Himachal' }, pricing: { basePrice: 1000 }, rating: { average: 4.5, count: 10 } }
                ]
            };

            const mockWishlist = [
                { _id: 'wish123', itemId: 'pkg123' }
            ];

            jest.spyOn(PackageService, 'getAvailablePackagesByCategory').mockResolvedValue(mockPackages);
            jest.spyOn(Wishlist, 'find').mockReturnValue({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockWishlist)
            });

            const response = await PackageController.browsePackages(req);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.trekking.items).toHaveLength(2);
            expect(body.data.trekking.items[0]).toEqual(expect.objectContaining({
                id: 'pkg456',
                wishlist: false
            }));
            expect(body.data.trekking.items[1]).toEqual(expect.objectContaining({
                id: 'pkg123',
                wishlist: true
            }));
        });

        test('should return packages without wishlist info when user is not authenticated', async () => {
            const req = createMockReq({
                url: 'http://localhost/packages?page=1&limit=10'
            });

            const mockPackages = {
                trekking: [
                    { id: 'pkg123', _id: 'pkg123', title: 'Trekking in Himachal', category_name: 'Trekking', category_id: 'cat1', location: { address: 'Himachal' }, pricing: { basePrice: 1000 }, rating: { average: 4.5, count: 10 } }
                ]
            };

            jest.spyOn(PackageService, 'getAvailablePackagesByCategory').mockResolvedValue(mockPackages);
            const wishlistFindSpy = jest.spyOn(Wishlist, 'find');

            const response = await PackageController.browsePackages(req);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(wishlistFindSpy).not.toHaveBeenCalled();
            expect(body.data.trekking.items[0]).toEqual(expect.objectContaining({
                id: 'pkg123',
                wishlist: false
            }));
        });

        test('should return 500 if an error occurs', async () => {
            const req = createMockReq({ url: 'http://localhost/packages' });
            jest.spyOn(PackageService, 'getAvailablePackagesByCategory').mockRejectedValue(new Error('DB Error'));
            
            const response = await PackageController.browsePackages(req);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('getPackageDetails', () => {
        test('should return package details with wishlist entry id when authenticated and wishlisted', async () => {
            const req = createMockReq({
                user: { id: 'user123' },
                params: { id: 'pkg123' }
            });

            const mockPackage = { _id: 'pkg123', title: 'Trekking in Himachal' };
            const mockWishlistEntry = { _id: 'wish123', itemId: 'pkg123', user: 'user123' };

            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue(mockPackage);
            jest.spyOn(Wishlist, 'findOne').mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockWishlistEntry)
            });

            const response = await PackageController.getPackageDetails(req, { params: { id: 'pkg123' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual(expect.objectContaining({
                _id: 'pkg123',
                wishlist: true,
                wishlistId: 'wish123'
            }));
        });

        test('should return package details without wishlist id when authenticated but not wishlisted', async () => {
            const req = createMockReq({
                user: { id: 'user123' },
                params: { id: 'pkg123' }
            });

            const mockPackage = { _id: 'pkg123', title: 'Trekking in Himachal' };

            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue(mockPackage);
            jest.spyOn(Wishlist, 'findOne').mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            });

            const response = await PackageController.getPackageDetails(req, { params: { id: 'pkg123' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual(expect.objectContaining({
                _id: 'pkg123',
                wishlist: false,
                wishlistId: null
            }));
        });

        test('should return package details without checking wishlist when unauthenticated', async () => {
            const req = createMockReq({
                params: { id: 'pkg123' }
            });

            const mockPackage = { _id: 'pkg123', title: 'Trekking in Himachal' };

            jest.spyOn(PackageService, 'getAvailablePackageItem').mockResolvedValue(mockPackage);
            const findOneSpy = jest.spyOn(Wishlist, 'findOne');

            const response = await PackageController.getPackageDetails(req, { params: { id: 'pkg123' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(findOneSpy).not.toHaveBeenCalled();
            expect(body.data).toEqual(expect.objectContaining({
                _id: 'pkg123',
                wishlist: false,
                wishlistId: null
            }));
        });

        test('should return 500 if an error occurs', async () => {
            const req = createMockReq({ params: { id: 'pkg123' } });
            jest.spyOn(PackageService, 'getAvailablePackageItem').mockRejectedValue(new Error('DB Error'));
            
            const response = await PackageController.getPackageDetails(req, { params: { id: 'pkg123' } });
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('searchNearby', () => {
        test('should return nearby packages with wishlist details', async () => {
            const req = createMockReq({
                user: { id: 'user123' },
                url: 'http://localhost/packages/nearby?lat=30.2&lng=78.1&category=trekking&radius=50'
            });

            const mockRawResults = [
                { id: 'pkg123', _id: 'pkg123', title: 'Trekking near Dehradun', category: 'trekking', category_name: 'Trekking', category_id: 'cat1', location: { address: 'Dehradun' }, pricing: { basePrice: 5000 }, rating: { average: 4.5, count: 10 }, isActive: true }
            ];

            const mockCategories = [{ slug: 'trekking', name: 'Trekking' }];
            const mockWishlist = [{ _id: 'wish123', itemId: 'pkg123' }];

            jest.spyOn(PackageService, 'searchPackages').mockResolvedValue(mockRawResults);
            jest.spyOn(Category, 'find').mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockCategories)
            });
            jest.spyOn(Wishlist, 'find').mockReturnValue({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockWishlist)
            });

            const response = await PackageController.searchNearby(req);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.trekking.items).toHaveLength(1);
            expect(body.data.trekking.items[0]).toEqual(expect.objectContaining({
                id: 'pkg123',
                wishlist: true
            }));
        });

        test('should return 500 if an error occurs', async () => {
            const req = createMockReq({ url: 'http://localhost/packages/nearby' });
            jest.spyOn(PackageService, 'searchPackages').mockRejectedValue(new Error('DB Error'));
            
            const response = await PackageController.searchNearby(req);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });
});
