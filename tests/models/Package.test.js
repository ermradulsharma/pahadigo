import mongoose from 'mongoose';
import Package from '../../src/core/Models/Package.js';
import { PACKAGE } from '../../src/core/Constants/index.js';

describe('PackageModel Test Suite', () => {

    it('should enforce required constraints on vendor id', async () => {
        const pkg = new Package({});
        let error;
        try {
            await pkg.validate();
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
        expect(error.errors.vendor).toBeDefined();
    });

    it('should allow creating a package with diverse subdocuments', async () => {
        const vendorId = new mongoose.Types.ObjectId();
        const packageData = {
            vendor: vendorId,
            services: {
                homestay: [{
                    title: 'Cozy Cottage',
                    homestayType: PACKAGE.ACCOMMODATION.HOMESTAY_TYPES.COTTAGE,
                    roomType: PACKAGE.ACCOMMODATION.ROOM_TYPES.STANDARD,
                    location: { address: 'Manali' }
                }],
                trekking: [{
                    title: 'Everest Base Camp',
                    description: 'A long trek',
                    pricing: { pricePerPerson: 50000 },
                    location: { address: 'Nepal' },
                    details: {
                        trekType: PACKAGE.ACTIVITY.TREK_TYPES.EXPEDITION
                    }
                }]
            }
        };

        const pkg = new Package(packageData);
        const savedPkg = await pkg.save();

        expect(savedPkg._id).toBeDefined();
        expect(savedPkg.services.homestay.length).toBe(1);
        expect(savedPkg.services.trekking.length).toBe(1);

        // Verify defaults populated inside subdocuments
        expect(savedPkg.services.homestay[0].isActive).toBe(true);
        expect(savedPkg.services.trekking[0].details.difficultyLevel).toBe(PACKAGE.DIFFICULTY.EASY);
    });

    it('should fail validation if an invalid enum is used in a subdocument', async () => {
        const vendorId = new mongoose.Types.ObjectId();
        const packageData = {
            vendor: vendorId,
            services: {
                trekking: [{
                    title: 'Bad Trek',
                    description: 'desc',
                    location: { address: 'Loc' },
                    details: {
                        trekType: 'NOT_A_VALID_TREK_TYPE'
                    }
                }]
            }
        };

        const pkg = new Package(packageData);
        let error;
        try {
            await pkg.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error.errors['services.trekking.0.details.trekType']).toBeDefined();
    });
});
