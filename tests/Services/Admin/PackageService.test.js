import PackageService from '@/core/Services/Admin/PackageService';
import Package from '@/core/Models/Package';
import mongoose from 'mongoose';
import { RESPONSE_MESSAGES } from '@/core/Constants';

describe('PackageService: toggleServiceStatus Integration Tests', () => {
    const mockVendorId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();
    const mockServiceId = new mongoose.Types.ObjectId();

    beforeEach(async () => {
        // Create a dummy package document in the memory DB with required fields
        await Package.create({
            vendor: mockUserId,
            business: mockVendorId,
            vehicleRental: [
                {
                    _id: mockServiceId,
                    title: "Test Vehicle",
                    description: "High quality rental service test description",
                    isActive: true,
                    pricing: { pricePerDay: 1000 },
                    location: { 
                        address: "Test Address", 
                        latitude: "30.3165", 
                        longitude: "78.0322",
                        coordinates: { type: 'Point', coordinates: [78.0322, 30.3165] }
                    }
                }
            ]
        });
    });

    it('[Success] should toggle isActive status in database', async () => {
        const result = await PackageService.toggleServiceStatus(
            mockServiceId.toString(),
            false,
            'vehicleRental',
            mockVendorId.toString(),
            mockUserId.toString()
        );

        expect(result.isActive).toBe(false);

        // Verify in DB
        const updatedDoc = await Package.findOne({ business: mockVendorId });
        expect(updatedDoc.vehicleRental[0].isActive).toBe(false);
    });

    it('[Failure] should throw error for non-existent vendor', async () => {
        const randomId = new mongoose.Types.ObjectId().toString();
        await expect(
            PackageService.toggleServiceStatus(mockServiceId.toString(), false, 'vehicleRental', randomId, randomId)
        ).rejects.toThrow(RESPONSE_MESSAGES.PACKAGE.NOT_FOUND);
    });

    it('[Failure] should throw error for non-existent service item', async () => {
        const randomServiceId = new mongoose.Types.ObjectId().toString();
        await expect(
            PackageService.toggleServiceStatus(randomServiceId, false, 'vehicleRental', mockVendorId.toString(), mockUserId.toString())
        ).rejects.toThrow(RESPONSE_MESSAGES.ITEM.NOT_FOUND);
    });
});
