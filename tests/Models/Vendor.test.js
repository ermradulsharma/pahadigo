import Vendor from '@/models/Vendor.js';
import { cleanDatabase, generateId } from '../Helpers/testUtils.js';

describe('Industry Standard: Vendor Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should create a valid vendor profile', async () => {
        const vendorData = {
            user: generateId(),
            businessName: 'Himalayan Tours',
            profileType: 'business',
            address: {
                city: 'Manali',
                location: { type: 'Point', coordinates: [77.1887, 32.2432] }
            }
        };
        const vendor = await Vendor.create(vendorData);
        expect(vendor.businessName).toBe('Himalayan Tours');
        expect(vendor.address.city).toBe('Manali');
        expect(vendor.address.location.coordinates[0]).toBe(77.1887);
    });

    it('[Failure] should fail if user association is missing', async () => {
        const vendor = new Vendor({ businessName: 'Test' });
        let err;
        try {
            await vendor.validate();
        } catch (e) {
            err = e;
        }
        expect(err.errors.user).toBeDefined();
    });

    it('[Default] should have default verification status', async () => {
        const vendor = await Vendor.create({ user: generateId(), businessName: 'Test' });
        expect(vendor.isApproved).toBe(false);
        expect(vendor.status).toBe('pending');
    });
});
