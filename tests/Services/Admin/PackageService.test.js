import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import {
    createMockQueryHelpers,
    createMockCacheService,
    createMockSession
} from '../../utils/mockHelpers.js';

const mockSession = createMockSession();
mongoose.startSession = jest.fn().mockResolvedValue(mockSession);

const s1 = '507f1f77bcf86cd799439011';
const v1 = '507f1f77bcf86cd799439012';
const p1 = '507f1f77bcf86cd799439013';

jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        findByIdAndDelete: jest.fn(),
        schema: {
            paths: {
                'hotels': { options: { type: [] } },
                'activities': { options: { type: [] } },
                'vendor': { options: { type: 'ObjectId' } }
            }
        }
    }
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {}
}));

const mockCache = createMockCacheService();
jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    default: mockCache
}));

const mockQHelpers = createMockQueryHelpers({
    getPackageBy: jest.fn(() => ({
        session: jest.fn().mockResolvedValue(null)
    }))
});
jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => mockQHelpers);

const { default: PackageService } = await import('@/core/Services/Admin/PackageService.js');
const { default: Package } = await import('@/core/Models/Package.js');
const { default: CacheService } = await import('@/core/Services/CacheService.js');
const { getPackageBy, getPackagesBy } = await import('@/core/Helpers/queryHelpers.js');

describe('Admin PackageService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('invalidatePackageCaches', () => {
        it('should invalidate specific caches based on provided parameters', async () => {
            await PackageService.invalidatePackageCaches(v1, s1);
            expect(CacheService.del).toHaveBeenCalledWith('admin:packages:all');
            expect(CacheService.del).toHaveBeenCalledWith(`admin:packages:vendor:${v1}`);
            expect(CacheService.del).toHaveBeenCalledWith(`admin:packages:item:${s1}`);
        });
    });

    describe('getAllServices', () => {
        it('should return from cache if available', async () => {
            CacheService.get.mockResolvedValue([{ id: 1 }]);
            const result = await PackageService.getAllServices();
            expect(result).toHaveLength(1);
            expect(getPackagesBy).not.toHaveBeenCalled();
        });

        it('should fetch from DB, transform, set cache, and return', async () => {
            CacheService.get.mockResolvedValue(null);
            
            const mockPackages = [
                {
                    _id: p1,
                    vendor: { _id: v1, name: 'Vendor' },
                    hotels: [{ _id: 'h1', name: 'Hotel 1' }],
                    activities: [{ _id: 'a1', name: 'Activity 1' }]
                }
            ];
            getPackagesBy.mockResolvedValue(mockPackages);

            const result = await PackageService.getAllServices();
            expect(result).toHaveLength(2); // 1 hotel + 1 activity
            expect(result[0].serviceType).toBe('hotels');
            expect(result[1].serviceType).toBe('activities');
            expect(CacheService.set).toHaveBeenCalledWith('admin:packages:all', result, 1800);
        });
    });

    describe('toggleServiceStatus', () => {
        it('should throw if item not found via direct query or service id', async () => {
            Package.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
            await expect(PackageService.toggleServiceStatus(s1, true, 'hotels', v1))
                .rejects.toThrow(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);
        });

        it('should toggle status if item is found', async () => {
            const mockPkg = {
                hotels: [{ _id: s1, isActive: false }],
                markModified: jest.fn(),
                save: jest.fn()
            };
            Package.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPkg) });
            
            const result = await PackageService.toggleServiceStatus(s1, true, 'hotels', v1);
            expect(mockPkg.hotels[0].isActive).toBe(true);
            expect(mockPkg.save).toHaveBeenCalled();
            expect(result.isActive).toBe(true);
            expect(CacheService.del).toHaveBeenCalled(); // Invalidates cache
        });
    });

    describe('getPackageItem', () => {
        it('should return cached item if available', async () => {
            CacheService.get.mockResolvedValue({ _id: s1, name: 'Cached' });
            const result = await PackageService.getPackageItem(s1);
            expect(result.name).toBe('Cached');
        });

        it('should fetch and format item if not cached', async () => {
            CacheService.get.mockResolvedValue(null);
            const mockPkg = {
                _id: p1,
                vendor: { _id: v1 },
                hotels: [{ _id: s1, name: 'DB Hotel' }]
            };
            getPackageBy.mockResolvedValue(mockPkg);

            const result = await PackageService.getPackageItem(s1);
            expect(result.name).toBe('DB Hotel');
            expect(result.serviceType).toBe('hotels');
            expect(CacheService.set).toHaveBeenCalled();
        });
    });

    describe('updatePackageItem', () => {
        it('should throw if package not found', async () => {
            Package.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
            getPackageBy.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
            await expect(PackageService.updatePackageItem(s1, {})).rejects.toThrow(RESPONSE_MESSAGES.ITEM.NOT_FOUND);
        });

        it('should update item and invalidate cache', async () => {
            const mockItem = { _id: s1, name: 'Old' };
            const mockPkg = {
                hotels: { id: jest.fn().mockReturnValue(mockItem) },
                toObject: jest.fn().mockReturnValue({ hotels: [mockItem] }),
                markModified: jest.fn(),
                save: jest.fn()
            };
            Package.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPkg) });
            getPackageBy.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPkg) });

            const result = await PackageService.updatePackageItem(s1, { name: 'New' });
            expect(result.name).toBe('New');
            expect(mockPkg.save).toHaveBeenCalled();
        });
    });

    describe('createPackage', () => {
        it('should create a new package if vendor does not have one', async () => {
            Package.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });
            Package.create.mockResolvedValue([{ vendor: v1 }]);
            
            const result = await PackageService.createPackage(v1, {});
            expect(Package.create).toHaveBeenCalled();
            expect(result.vendor).toBe(v1);
        });
    });

    describe('deletePackage', () => {
        it('should delete package and invalidate cache', async () => {
            Package.findByIdAndDelete.mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: p1, vendor: v1 }) });
            await PackageService.deletePackage(p1);
            expect(CacheService.del).toHaveBeenCalledWith(`admin:packages:vendor:${v1}`);
        });
    });

    describe('getVendorPackages', () => {
        it('should return from cache if available', async () => {
            CacheService.get.mockResolvedValue([]);
            const result = await PackageService.getVendorPackages(v1);
            expect(result).toEqual([]);
        });

        it('should fetch, transform and cache vendor packages', async () => {
            CacheService.get.mockResolvedValue(null);
            
            const mockPackages = [
                {
                    _id: p1,
                    vendor: { _id: v1 },
                    hotels: [{ _id: 'h1', name: 'Hotel 1' }]
                }
            ];
            getPackagesBy.mockResolvedValue(mockPackages);

            const result = await PackageService.getVendorPackages(v1);
            expect(result).toHaveLength(1);
            expect(result[0].serviceType).toBe('hotels');
        });
    });
});
