import Inventory from '../../src/core/Models/Inventory.js';
import mongoose from 'mongoose';

describe('Inventory Model', () => {
    const vendorId = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();

    beforeEach(async () => {
        await Inventory.deleteMany({});
    });

    it('should create an inventory entry with defaults', async () => {
        const inv = await Inventory.create({
            vendorId,
            itemId,
            serviceType: 'accommodation',
            calendar: [{
                date: new Date(),
                totalUnits: 10,
                status: 'available'
            }]
        });

        expect(inv.vendorId).toEqual(vendorId);
        expect(inv.calendar[0].totalUnits).toBe(10);
        expect(inv.calendar[0].bookedUnits).toBe(0);
        expect(inv.calendar[0].status).toBe('available');
    });

    it('should require vendorId and itemId', async () => {
        const inv = new Inventory({});
        await expect(inv.save()).rejects.toThrow();
    });
});
