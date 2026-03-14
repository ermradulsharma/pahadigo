import mongoose from 'mongoose';
import CategoryDocument from '../../src/core/Models/CategoryDocument.js';

describe('CategoryDocumentModel Test Suite', () => {

    it('should fail if missing required name or category_slug', async () => {
        const doc = new CategoryDocument({});
        let error;
        try {
            await doc.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error.errors.name).toBeDefined();
        expect(error.errors.category_slug).toBeDefined();
    });

    it('should save a valid CategoryDocument with defaults', async () => {
        const docInfo = {
            name: 'Medical Insurance',
            slug: 'medical-insurance',
            category_slug: 'adventure'
        };

        const document = new CategoryDocument(docInfo);
        const savedDocument = await document.save();

        expect(savedDocument._id).toBeDefined();
        expect(savedDocument.isMandatory).toBe(false); // default
        expect(savedDocument.isActive).toBe(true); // default
    });
});
