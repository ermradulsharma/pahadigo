import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockQuery = {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    then: jest.fn(function(resolve) { resolve(this._resolvedValue); }),
    _resolveWith: function(val) { this._resolvedValue = val; return this; }
};

jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: { 
        find: jest.fn(() => mockQuery),
        findOne: jest.fn(() => mockQuery),
        findByIdAndDelete: jest.fn(),
        schema: {
            paths: {
                trekking: { options: { type: [Object] } },
                homestay: { options: { type: [Object] } }
            }
        }
    }
}));

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: { findById: jest.fn() }
}));

const { default: PackageService } = await import('@/services/Admin/PackageService.js');
const { default: Package } = await import('@/core/Models/Package.js');

describe('Industry Standard: Admin PackageService Logic', () => {
    const validId1 = new mongoose.Types.ObjectId().toString();
    const validId2 = new mongoose.Types.ObjectId().toString();
    const validId3 = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery._resolvedValue = null;
    });

    it('[Stats] should aggregate all services into a flat list', async () => {
        const mockPackages = [{
            _id: validId1,
            vendor: { _id: validId2, businessName: 'Himalayan Tours' },
            trekking: [{ _id: validId3, title: 'Everest Base Camp' }]
        }];
        Package.find()._resolveWith(mockPackages);

        const services = await PackageService.getAllServices();

        expect(services).toHaveLength(1);
        expect(services[0].serviceType).toBe('trekking');
    });

    it('[Toggle] should successfully toggle service status', async () => {
        const mockPkg = {
            _id: validId1,
            trekking: [{ _id: validId3, isActive: false }],
            markModified: jest.fn(),
            save: jest.fn().mockResolvedValue(true)
        };
        Package.findOne()._resolveWith(mockPkg);

        const result = await PackageService.toggleServiceStatus(validId3, true, 'trekking', validId2, validId1);

        expect(result.isActive).toBe(true);
        expect(mockPkg.markModified).toHaveBeenCalledWith('trekking');
    });
});
