import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: {
        findOneAndUpdate: jest.fn(),
        findById: jest.fn(),
    }
}));

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: {
        find: jest.fn(),
    }
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {
        findByIdAndUpdate: jest.fn(),
    }
}));

jest.unstable_mockModule('@/core/Models/Review.js', () => ({
    default: {
        aggregate: jest.fn(),
    }
}));

jest.unstable_mockModule('@/core/Models/Booking.js', () => ({
    default: {
        countDocuments: jest.fn(),
    }
}));

jest.unstable_mockModule('@/core/Models/Dispute.js', () => ({
    default: {
        countDocuments: jest.fn(),
    }
}));

jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: {
        findOne: jest.fn(),
    }
}));

jest.unstable_mockModule('@/core/Models/VendorClosure.js', () => ({
    default: {
        find: jest.fn(() => ({ sort: jest.fn() })),
    }
}));

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => ({
    getBusinessBy: jest.fn(),
    getBusinessById: jest.fn(),
    getBusinessByUserId: jest.fn(),
    getManyBy: jest.fn(),
    getPackageBy: jest.fn()
}));

jest.unstable_mockModule('@/core/Helpers/geoUtils.js', () => ({
    mapToGeoJSON: jest.fn(),
}));

const { default: BusinessService } = await import('@/core/Services/Vendor/BusinessService.js');
const { default: Vendor } = await import('@/core/Models/Vendor.js');
const { default: Category } = await import('@/core/Models/Category.js');
const { default: User } = await import('@/core/Models/User.js');
const { default: Package } = await import('@/core/Models/Package.js');
const { default: Booking } = await import('@/core/Models/Booking.js');
const { default: Dispute } = await import('@/core/Models/Dispute.js');
const { default: Review } = await import('@/core/Models/Review.js');
const { default: VendorClosure } = await import('@/core/Models/VendorClosure.js');
const queryHelpers = await import('@/core/Helpers/queryHelpers.js');
const geoUtils = await import('@/core/Helpers/geoUtils.js');

describe('BusinessService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('syncBusinessProfile', () => {
        it('should correctly map categories, geocode address, pending documents and update vendor', async () => {
            Category.find.mockResolvedValue([{ _id: 'cat1', name: 'Hotel', slug: 'hotel' }]);
            
            const mockVendor = { _id: 'v1', ownerName: 'Test Owner', populate: jest.fn().mockResolvedValue({ _id: 'v1' }) };
            Vendor.findOneAndUpdate.mockResolvedValue(mockVendor);

            const profileData = {
                businessName: 'My Hotel',
                businessCategory: ['hotel'],
                address: { city: 'Dehradun' },
                documents: { panCard: { file: 'pan.pdf' }, other: 'text' },
                bankDetails: { accountNumber: '123' }
            };

            const result = await BusinessService.syncBusinessProfile('u1', profileData);

            expect(Category.find).toHaveBeenCalledWith({ slug: { $in: ['hotel'] } });
            expect(geoUtils.mapToGeoJSON).toHaveBeenCalledWith(profileData.address, 'location');
            expect(Vendor.findOneAndUpdate).toHaveBeenCalledWith(
                { user: 'u1' },
                expect.objectContaining({
                    user: 'u1',
                    businessName: 'My Hotel',
                    category: [{ _id: 'cat1', name: 'Hotel', slug: 'hotel' }],
                    'documents.panCard': { file: 'pan.pdf', status: 'pending' },
                    'documents.other': 'text',
                    'bankDetails.accountNumber': '123'
                }),
                expect.any(Object)
            );
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { vendorProfile: 'v1', name: 'Test Owner' }, expect.any(Object));
            expect(result).toBeDefined();
        });
    });

    describe('getBusinessByUserId & getBusinessProfile', () => {
        it('should fetch business profile with closures', async () => {
            const mockVendor = { _id: 'v1' };
            queryHelpers.getBusinessByUserId.mockResolvedValue(mockVendor);
            
            const mockClosures = [{ _id: 'closure1' }];
            VendorClosure.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(mockClosures) });

            const result = await BusinessService.getBusinessProfile('u1');
            
            expect(queryHelpers.getBusinessByUserId).toHaveBeenCalledWith('u1', '', expect.any(Object));
            expect(result.closurePeriods).toEqual(mockClosures);
        });

        it('should return null if no business is found', async () => {
            queryHelpers.getBusinessByUserId.mockResolvedValue(null);
            const result = await BusinessService.getBusinessProfile('u1');
            expect(result).toBeNull();
        });
    });

    describe('removeBusinessProfile', () => {
        it('should mark vendor as deleted', async () => {
            await BusinessService.removeBusinessProfile('u1', 'admin1');
            expect(Vendor.findOneAndUpdate).toHaveBeenCalledWith(
                { user: 'u1', deletedAt: null },
                expect.objectContaining({ deletedBy: 'admin1', deletedAt: expect.any(Date) }),
                expect.any(Object)
            );
        });
    });

    describe('calculateTrustBadge', () => {
        it('should return none if vendor not found', async () => {
            Vendor.findById.mockResolvedValue(null);
            const badge = await BusinessService.calculateTrustBadge('v1');
            expect(badge).toBeNull();
        });

        it('should return verified if basic criteria is met', async () => {
            const mockVendor = {
                _id: 'v1',
                status: 'active',
                documents: {
                    aadharCard: [{ status: 'verified' }],
                    panCard: { status: 'verified' },
                    businessRegistration: { status: 'verified' }
                },
                profileType: 'business',
                save: jest.fn()
            };
            Vendor.findById.mockResolvedValue(mockVendor);
            Package.findOne.mockResolvedValue(null);

            const badge = await BusinessService.calculateTrustBadge('v1');
            expect(badge).toBe('verified');
            expect(mockVendor.trustBadge).toBe('verified');
            expect(mockVendor.save).toHaveBeenCalled();
        });

        it('should return super_partner if high performance criteria is met', async () => {
            const mockVendor = {
                _id: 'v1',
                status: 'active',
                documents: {
                    aadharCard: [{ status: 'verified' }],
                    panCard: { status: 'verified' }
                },
                profileType: 'individual',
                save: jest.fn()
            };
            Vendor.findById.mockResolvedValue(mockVendor);
            Package.findOne.mockResolvedValue({ _id: 'cat1' });
            Booking.countDocuments.mockResolvedValue(15);
            Dispute.countDocuments.mockResolvedValue(0);
            Review.aggregate.mockResolvedValue([{ avgRating: 4.8 }]);

            const badge = await BusinessService.calculateTrustBadge('v1');
            expect(badge).toBe('super_partner');
        });
        
        it('should fallback to verified if dispute rate is high or ratings low', async () => {
            const mockVendor = {
                _id: 'v1',
                status: 'active',
                documents: {
                    aadharCard: [{ status: 'verified' }],
                    panCard: { status: 'verified' }
                },
                profileType: 'individual',
                save: jest.fn()
            };
            Vendor.findById.mockResolvedValue(mockVendor);
            Package.findOne.mockResolvedValue({ _id: 'cat1' });
            Booking.countDocuments.mockResolvedValue(15);
            Dispute.countDocuments.mockResolvedValue(2); // 2/15 > 0.05
            Review.aggregate.mockResolvedValue([{ avgRating: 4.8 }]);

            const badge = await BusinessService.calculateTrustBadge('v1');
            expect(badge).toBe('verified');
        });
    });

    describe('status updates', () => {
        it('should updateBusinessStatus', async () => {
            await BusinessService.updateBusinessStatus('u1', 'active');
            expect(Vendor.findOneAndUpdate).toHaveBeenCalledWith(
                { user: 'u1', deletedAt: null },
                { status: 'active' },
                expect.any(Object)
            );
        });

        it('should toggleOperatingStatus', async () => {
            await BusinessService.toggleOperatingStatus('u1', false);
            expect(Vendor.findOneAndUpdate).toHaveBeenCalledWith(
                { user: 'u1', deletedAt: null },
                { isOperating: false },
                expect.any(Object)
            );
        });
    });

    describe('getBusinessById & getPublicBusinessProfile', () => {
        it('should getBusinessById', async () => {
            await BusinessService.getBusinessById('v1');
            expect(queryHelpers.getBusinessById).toHaveBeenCalledWith('v1', '', expect.any(Object));
        });

        it('should getPublicBusinessProfile', async () => {
            await BusinessService.getPublicBusinessProfile('v1');
            expect(queryHelpers.getBusinessById).toHaveBeenCalledWith('v1', expect.any(String));
        });
    });
});
