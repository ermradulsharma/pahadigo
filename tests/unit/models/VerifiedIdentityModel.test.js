import mongoose from 'mongoose';
import VerifiedIdentity from '../../../src/core/Models/VerifiedIdentity.js';

describe('VerifiedIdentityModel Test Suite', () => {
    beforeEach(async () => {
        await VerifiedIdentity.syncIndexes();
    });

    it('should require vendor, docType, and idNumber', async () => {
        const identity = new VerifiedIdentity({});
        let error;
        try { await identity.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.vendor).toBeDefined();
        expect(error.errors.docType).toBeDefined();
        expect(error.errors.idNumber).toBeDefined();
    });

    it('should enforce docType enum of Aadhar or PAN', async () => {
        const identity = new VerifiedIdentity({
            vendor: new mongoose.Types.ObjectId(),
            docType: 'PASSPORT', // Invalid
            idNumber: 'A00000000'
        });

        let error;
        try { await identity.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.docType).toBeDefined();
    });

    it('should uniqueness of vendor and docType', async () => {
        const vendorId = new mongoose.Types.ObjectId();
        await new VerifiedIdentity({
            vendor: vendorId, docType: 'PAN', idNumber: 'AAA000AA'
        }).save();

        const dup = new VerifiedIdentity({
            vendor: vendorId, docType: 'PAN', idNumber: 'BBB111BB'
        });

        let error;
        try { await dup.save(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.code).toBe(11000);
    });
});
