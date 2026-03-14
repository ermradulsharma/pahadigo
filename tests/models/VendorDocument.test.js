import mongoose from 'mongoose';
import VendorDocument from '../../src/core/Models/VendorDocument.js';

describe('VendorDocumentModel Test Suite', () => {
    beforeEach(async () => {
        await VendorDocument.syncIndexes();
    });

    it('should require vendor_id, category_slug, document_slug, and url', async () => {
        const doc = new VendorDocument({});
        let error;
        try { await doc.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.vendor_id).toBeDefined();
        expect(error.errors.category_slug).toBeDefined();
        expect(error.errors.document_slug).toBeDefined();
        expect(error.errors.url).toBeDefined();
    });

    it('should enforce unique compound index for vendor and document_slug', async () => {
        const vendorId = new mongoose.Types.ObjectId();

        await new VendorDocument({
            vendor_id: vendorId,
            category_slug: 'hotel',
            document_slug: 'trade_license',
            url: 'http://test.com/doc.pdf'
        }).save();

        const duplicateDoc = new VendorDocument({
            vendor_id: vendorId,
            category_slug: 'food',
            document_slug: 'trade_license', // Same slug different sub-path
            url: 'http://test.com/doc2.pdf'
        });

        let dupError;
        try { await duplicateDoc.save(); } catch (e) { dupError = e; }

        expect(dupError).toBeDefined();
        expect(dupError.code).toBe(11000);
    });
});
