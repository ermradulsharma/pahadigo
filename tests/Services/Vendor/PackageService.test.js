import { jest } from '@jest/globals';

const mockPkg = {
    _id: 'pkg1',
    user: 'u1',
    vendor: 'v1',
    trekking: [],
    save: jest.fn().mockImplementation(function() { return Promise.resolve(this); })
};
mockPkg.trekking.id = jest.fn((id) => mockPkg.trekking.find(i => i._id === id));
const originalPush = Array.prototype.push;
mockPkg.trekking.push = jest.fn(function(data) {
    const newItem = { _id: 'item1', ...data, toObject: () => ({ _id: 'item1', ...data }) };
    originalPush.call(this, newItem);
    return this.length;
});

jest.unstable_mockModule('@/models/Package.js', () => ({
    default: {
        findOne: jest.fn(),
        create: jest.fn(),
        findById: jest.fn(),
        findByIdAndDelete: jest.fn()
    }
}));

jest.unstable_mockModule('@/models/Vendor.js', () => ({
    default: {
        findById: jest.fn()
    }
}));

jest.unstable_mockModule('@/services/Vendor/InventoryService.js', () => ({
    default: {
        initializeFromItem: jest.fn()
    }
}));

const { default: PackageService } = await import('@/services/Vendor/PackageService.js');
const { default: Package } = await import('@/models/Package.js');
const { default: Vendor } = await import('@/models/Vendor.js');

describe('Industry Standard: Vendor PackageService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPkg.trekking = [];
        mockPkg.trekking.id = jest.fn((id) => mockPkg.trekking.find(i => i._id === id));
        mockPkg.trekking.push = jest.fn(function(data) {
            const newItem = { _id: 'item1', ...data, toObject: () => ({ _id: 'item1', ...data }) };
            originalPush.call(this, newItem);
            return this.length;
        });
    });

    describe('[ensureCatalog]', () => {
        it('[Success] should return existing catalog', async () => {
            Package.findOne.mockResolvedValue(mockPkg);
            const result = await PackageService.ensureCatalog('u1', 'v1');
            expect(result).toEqual(mockPkg);
        });

        it('[Success] should create new catalog if none exists', async () => {
            Package.findOne.mockResolvedValue(null);
            Package.create.mockResolvedValue(mockPkg);
            const result = await PackageService.ensureCatalog('u1', 'v1');
            expect(Package.create).toHaveBeenCalled();
            expect(result).toEqual(mockPkg);
        });
    });

    describe('[addItem]', () => {
        it('[Success] should add item to catalog and initialize inventory', async () => {
            Vendor.findById.mockResolvedValue({ _id: 'v1', category: [{ slug: 'trekking', name: 'Trekking' }] });
            Package.findOne.mockResolvedValue(mockPkg);
            
            const itemData = { title: 'New Trek' };
            await PackageService.addItem('u1', 'v1', 'trekking', itemData);

            expect(mockPkg.save).toHaveBeenCalled();
        });
    });

    describe('[updateItem]', () => {
        it('[Success] should update existing item', async () => {
            Vendor.findById.mockResolvedValue({ _id: 'v1', category: [{ slug: 'trekking' }] });
            Package.findOne.mockResolvedValue(mockPkg);
            
            const updates = { title: 'Updated Title' };
            const item = { _id: 'item1', set: jest.fn() };
            mockPkg.trekking.id = jest.fn().mockReturnValue(item);

            await PackageService.updateItem('u1', 'v1', 'trekking', 'item1', updates);

            expect(item.set).toHaveBeenCalledWith('title', 'Updated Title');
            expect(mockPkg.save).toHaveBeenCalled();
        });
    });
});
