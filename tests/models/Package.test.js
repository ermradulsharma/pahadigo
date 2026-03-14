import mongoose from 'mongoose';
import Package from '../../src/core/Models/Package.js';

describe('PackageModel Test Suite', () => {
    it('should enforce required constraints on vendor id', async () => {
        const pkg = new Package({});
        let error;
        try { await pkg.validate(); } catch (e) { error = e; }
        expect(error).toBeDefined();
        expect(error.errors.vendor).toBeDefined();
    });

    it('should allow creating a package with diverse subdocuments', async () => {
        const vendorId = new mongoose.Types.ObjectId();
        const pkgData = {
            vendor: vendorId,
            homestay: [{
                title: 'Mountain Retreat',
                description: 'A cozy stay',
                price: 2500,
                location: { address: 'Manali' }
            }],
            trekking: [{
                title: 'Hampta Pass',
                description: 'Moderate trek',
                pricing: { pricePerPerson: 15000 },
                details: {
                    trekType: 'Day Trek',
                    difficultyLevel: 'Moderate',
                    duration: '5 Days'
                },
                location: { address: 'Manali' }
            }]
        };

        const pkg = new Package(pkgData);
        const savedPkg = await pkg.save();

        expect(savedPkg._id).toBeDefined();
        expect(savedPkg.homestay.length).toBe(1);
        expect(savedPkg.trekking.length).toBe(1);

        // Verify defaults populated inside subdocuments
        expect(savedPkg.homestay[0].isActive).toBe(true);
        expect(savedPkg.trekking[0].location.address).toBe('Manali');
    });

    it('should fail validation if an invalid enum is used in a subdocument', async () => {
        const vendorId = new mongoose.Types.ObjectId();
        const pkg = new Package({
            vendor: vendorId,
            trekking: [{
                title: 'Invalid Trek',
                description: 'desc',
                location: { address: 'Nowhere' },
                details: {
                    trekType: 'EXTREME_DANGER' // Invalid enum
                }
            }]
        });

        let error;
        try {
            await pkg.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        // The error path for flat schema trekking array with nested details
        expect(error.errors['trekking.0.details.trekType']).toBeDefined();
    });
});
