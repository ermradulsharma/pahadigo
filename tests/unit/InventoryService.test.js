import { InventoryService } from '@/services';
import { Inventory, Package, Booking } from '@/models';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('InventoryService', () => {
    const vendorId = new mongoose.Types.ObjectId();
    const itemId = new mongoose.Types.ObjectId();
    const serviceType = 'homestay';

    beforeEach(async () => {
        await Inventory.deleteMany({});
        await Package.deleteMany({});
        await Booking.deleteMany({});
        jest.clearAllMocks();
    });

    describe('updateInventory', () => {
        it('should create new inventory if not exists', async () => {
            const updates = [{
                date: new Date(),
                totalUnits: 10,
                bookedUnits: 2,
                status: 'available',
                pricing: { basePrice: 1000 }
            }];

            const result = await InventoryService.updateInventory(vendorId, itemId, serviceType, updates);
            expect(result.vendorId.toString()).toBe(vendorId.toString());
            expect(result.calendar).toHaveLength(1);
            expect(result.calendar[0].totalUnits).toBe(10);
        });

        it('should update existing inventory index', async () => {
            const date = new Date();
            date.setHours(0, 0, 0, 0);

            await Inventory.create({
                vendorId, itemId, serviceType,
                calendar: [{ date, totalUnits: 5, bookedUnits: 0, status: 'available' }]
            });

            const updates = [{
                date,
                totalUnits: 20
            }];

            const result = await InventoryService.updateInventory(vendorId, itemId, serviceType, updates);
            expect(result.calendar[0].totalUnits).toBe(20);
        });
    });

    describe('checkAvailabilityRange', () => {
        it('should return available true if units exist', async () => {
             await Package.create({
                 vendor: vendorId,
                 homestay: [{
                     _id: itemId,
                     title: 'Test Room',
                     isActive: true,
                     homestayType: 'Cottage',
                     roomDetails: { roomType: 'Standard' },
                     location: { address: 'Test Addr' },
                     availability: { totalRooms: 5 }
                 }]
             });

             const start = new Date();
             const end = new Date();
             end.setDate(end.getDate() + 1);

             const res = await InventoryService.checkAvailabilityRange(vendorId, itemId, serviceType, start, end, 2);
             expect(res.available).toBe(true);
        });

        it('should return false if units insufficient', async () => {
            await Package.create({
                vendor: vendorId,
                homestay: [{
                    _id: itemId,
                    title: 'Test Room',
                    isActive: true,
                    homestayType: 'Cottage',
                    roomDetails: { roomType: 'Standard' },
                    location: { address: 'Test Addr' },
                    availability: { totalRooms: 5 }
                }]
            });

            const date = new Date();
            await Inventory.create({
                vendorId, itemId, serviceType,
                calendar: [{ date, totalUnits: 5, bookedUnits: 4, status: 'available' }]
            });

            const res = await InventoryService.checkAvailabilityRange(vendorId, itemId, serviceType, date, date, 2);
            expect(res.available).toBe(false);
            expect(res.reason).toContain('Insufficient units');
        });
    });

    describe('reserveSlotsRange', () => {
        it('should increase booked units', async () => {
            await Package.create({
                vendor: vendorId,
                homestay: [{
                    _id: itemId,
                    isActive: true,
                    homestayType: 'Cottage',
                    roomDetails: { roomType: 'Standard' },
                    location: { address: 'Test Addr' },
                    availability: { totalRooms: 10 }
                }]
            });

            const date = new Date();
            date.setHours(0,0,0,0);

            await InventoryService.reserveSlotsRange(vendorId, itemId, serviceType, date, date, 3);
            
            const inv = await Inventory.findOne({ vendorId, itemId });
            expect(inv.calendar[0].bookedUnits).toBe(3);
        });

        it('should throw error if reservation exceeds capacity', async () => {
            await Package.create({
                vendor: vendorId,
                homestay: [{
                    _id: itemId,
                    isActive: true,
                    homestayType: 'Cottage',
                    roomDetails: { roomType: 'Standard' },
                    location: { address: 'Test Addr' },
                    availability: { totalRooms: 2 }
                }]
            });

            const date = new Date();
            await expect(InventoryService.reserveSlotsRange(vendorId, itemId, serviceType, date, date, 5))
                .rejects.toThrow('Insufficient units');
        });
    });

    describe('releaseSlotsRange', () => {
         it('should decrease booked units', async () => {
             const date = new Date();
             date.setHours(0,0,0,0);

             await Inventory.create({
                 vendorId, itemId, serviceType,
                 calendar: [{ date, totalUnits: 10, bookedUnits: 5 }]
             });

             await InventoryService.releaseSlotsRange(vendorId, itemId, serviceType, date, date, 2);

             const inv = await Inventory.findOne({ vendorId, itemId });
             expect(inv.calendar[0].bookedUnits).toBe(3);
         });
    });
});
