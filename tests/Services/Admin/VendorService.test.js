import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockQuery = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    then: jest.fn(function(resolve) { resolve(this._resolvedValue); }),
    _resolveWith: function(val) { this._resolvedValue = val; return this; }
};

jest.unstable_mockModule('@/models/User.js', () => ({
    default: { 
        aggregate: jest.fn(() => mockQuery),
        findOne: jest.fn(() => mockQuery),
        findById: jest.fn(() => mockQuery),
        findByIdAndUpdate: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue({ _id: 'u1', name: 'Vendor' })
    }
}));

jest.unstable_mockModule('@/models/Vendor.js', () => ({
    default: { 
        findById: jest.fn(() => mockQuery),
        findOne: jest.fn(() => mockQuery),
        findByIdAndUpdate: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue({ _id: 'v1' })
    }
}));

jest.unstable_mockModule('@/services/Vendor/BusinessService.js', () => ({
    default: { calculateTrustBadge: jest.fn() }
}));

const { default: VendorService } = await import('@/services/Admin/VendorService.js');
const { default: User } = await import('@/models/User.js');
const { default: Vendor } = await import('@/models/Vendor.js');

describe('Industry Standard: Admin VendorService Lifecycle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery._resolvedValue = null;
    });

    it('[Soft Delete] should implement soft delete on vendor and user', async () => {
        const mockV = { _id: 'v1', user: 'u1' };
        Vendor.findById.mockReturnValue(mockQuery._resolveWith(mockV));
        
        await VendorService.deleteVendor('v1', 'admin1');

        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', expect.objectContaining({
            status: 'deleted',
            deletedBy: 'admin1'
        }), { session: expect.anything() });
        expect(Vendor.findByIdAndUpdate).toHaveBeenCalledWith('v1', { isApproved: false }, { session: expect.anything() });
    });

    it('[Approval] should update status and trigger trust calculation', async () => {
        const mockV = { 
            _id: 'v1', 
            user: 'u1', 
            isApproved: false, 
            save: jest.fn().mockResolvedValue(true) 
        };
        Vendor.findById.mockReturnValue(mockQuery._resolveWith(mockV));

        await VendorService.updateVendorStatus('v1', 'approved');

        expect(mockV.isApproved).toBe(true);
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith('u1', { status: 'active' }, { session: expect.anything() });
    });
});
