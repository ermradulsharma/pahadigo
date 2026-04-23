import mongoose from 'mongoose';
import HomestaySchema from '@/models/PackageSchemas/HomestaySchema.js';
import { cleanDatabase } from '../../Helpers/testUtils.js';

const HomestayModel = mongoose.models.HomestayTest || mongoose.model('HomestayTest', HomestaySchema);

describe('Industry Standard: HomestaySchema Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should create a valid homestay item', async () => {
        const itemData = {
            title: 'Himalayan Homestay',
            homestayType: 'Cottage',
            roomDetails: { roomType: 'Standard' },
            location: { address: 'Manali' }
        };
        const item = await HomestayModel.create(itemData);
        expect(item.title).toBe('Himalayan Homestay');
        expect(item.isActive).toBe(true);
    });

    it('[Failure] should fail for invalid enum values', async () => {
        const item = new HomestayModel({ homestayType: 'invalid-type' });
        let err;
        try {
            await item.validate();
        } catch (e) {
            err = e;
        }
        expect(err.errors.homestayType).toBeDefined();
    });

    it('[Pricing] should format price with 2 decimal places using getter', async () => {
        const item = await HomestayModel.create({
            title: 'Price Test',
            homestayType: 'Cottage',
            roomDetails: { roomType: 'Standard' },
            pricing: { pricePerNight: 1200.5 },
            location: { address: 'Manali' }
        });
        expect(item.pricing.pricePerNight).toBe('1200.50');
    });
});
