import { jest } from '@jest/globals';

const mockAppConfig = {
    tax: {
        gst: 18,
        service_tax: 2.5
    }
};

const mockPackage = {
    findById: jest.fn()
};

const mockVendorDocument = {
    findOne: jest.fn()
};

const mockQueryHelpers = {
    getPackageItemById: jest.fn(),
    getReviewsByItemId: jest.fn()
};

const mockHelpers = {
    businessPayload: jest.fn(),
    itemBusinessPayload: jest.fn(),
    vendorPackageItem: jest.fn((item, reviews) => ({ ...item, reviews })),
    userPayloadMini: jest.fn(),
    businessPayloadMini: jest.fn()
};

const mockMasterService = {
    isVendorActive: jest.fn()
};

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue(mockAppConfig)
}));

jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: mockPackage
}));

jest.unstable_mockModule('@/core/Models/VendorDocument.js', () => ({
    default: mockVendorDocument
}));

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => mockQueryHelpers);
jest.unstable_mockModule('@/core/Helpers/index.js', () => mockHelpers);
jest.unstable_mockModule('@/core/Services/MasterService.js', () => ({
    default: mockMasterService
}));

const {
    normalizeCoordinates,
    getTaxConfig,
    applyTaxesToPricing,
    enrichItemsWithTaxes,
    getFlattenPackageItemsStages,
    getReviewsLookupStage,
    getVendorProfileLookupStages,
    getPackageItemProjectionStage,
    getItemDetailsPayload,
    default: PackageCoreDefault
} = await import('@/core/Services/Shared/PackageCore.js');

describe('Industry Standard: PackageCore Shared Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('normalizeCoordinates', () => {
        it('should correctly parse valid numeric coordinates', () => {
            const { latitude, longitude, hasCoords } = normalizeCoordinates('30.3165', '78.0322');
            expect(hasCoords).toBe(true);
            expect(latitude).toBe(30.3165);
            expect(longitude).toBe(78.0322);
        });

        it('should autocorrect swapped coordinates when lat > 45 and lng < 45 in India region', () => {
            // e.g. Passed lat = 78.0322 (Longitude of Uttarakhand), lng = 30.3165 (Latitude of Uttarakhand)
            const { latitude, longitude } = normalizeCoordinates(78.0322, 30.3165);
            expect(latitude).toBe(30.3165);
            expect(longitude).toBe(78.0322);
        });

        it('should report hasCoords as false for invalid coordinates', () => {
            const { hasCoords } = normalizeCoordinates('invalid', null);
            expect(hasCoords).toBe(false);
        });
    });

    describe('Tax Configuration & Pricing Enrichment', () => {
        it('should retrieve tax rates from app configuration', async () => {
            const taxes = await getTaxConfig();
            expect(taxes.gst).toBe(18);
            expect(taxes.serviceTax).toBe(2.5);
        });

        it('should apply taxes into pricing payload', () => {
            const pricing = { basePrice: 2000 };
            const enriched = applyTaxesToPricing(pricing, { gst: 18, serviceTax: 2.5 });
            expect(enriched.basePrice).toBe(2000);
            expect(enriched.gst).toBe(18);
            expect(enriched.serviceTax).toBe(2.5);
        });

        it('should enrich an array of items with tax rates', async () => {
            const items = [{ id: '1', pricing: { basePrice: 1500 } }];
            const enriched = await enrichItemsWithTaxes(items);
            expect(enriched[0].pricing.gst).toBe(18);
            expect(enriched[0].pricing.serviceTax).toBe(2.5);
        });
    });

    describe('Aggregation Pipeline Builders', () => {
        it('should generate valid multi-category flattening stages', () => {
            const stages = getFlattenPackageItemsStages({ catalogPrefix: 'catalog' });
            expect(Array.isArray(stages)).toBe(true);
            expect(stages.length).toBe(2);
            expect(stages[0].$project).toBeDefined();
            expect(stages[1].$unwind).toBe('$items');
        });

        it('should generate review lookup stage', () => {
            const stage = getReviewsLookupStage('$items._id');
            expect(stage.$lookup).toBeDefined();
            expect(stage.$lookup.from).toBe('reviews');
        });

        it('should generate vendor profile lookup stages', () => {
            const stages = getVendorProfileLookupStages('$vendor');
            expect(stages.length).toBe(2);
            expect(stages[0].$lookup.from).toBe('vendors');
        });

        it('should generate standardized package projection stage', () => {
            const stage = getPackageItemProjectionStage({ extra: 1 }, '_id');
            expect(stage.$project._id).toBe('$items._id');
            expect(stage.$project.extra).toBe(1);
        });
    });

    describe('getItemDetailsPayload', () => {
        it('should return null if itemId is missing or not found', async () => {
            expect(await getItemDetailsPayload(null)).toBeNull();
            mockQueryHelpers.getPackageItemById.mockResolvedValue(null);
            expect(await getItemDetailsPayload('non_existent')).toBeNull();
        });

        it('should return null if parent package or vendor is inactive', async () => {
            mockQueryHelpers.getPackageItemById.mockResolvedValue({
                _id: 'item_1',
                catalogId: 'cat_1',
                category: 'trekking'
            });

            const mockChain = {
                populate: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue({
                    _id: 'cat_1',
                    vendor: { _id: 'vendor_1' }
                })
            };
            mockPackage.findById.mockReturnValue(mockChain);
            mockMasterService.isVendorActive.mockResolvedValue(false);

            const res = await getItemDetailsPayload('item_1', mockMasterService);
            expect(res).toBeNull();
        });
    });
});
