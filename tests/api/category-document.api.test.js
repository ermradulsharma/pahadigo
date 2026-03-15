import CategoryDocumentController from '../../src/core/Http/Controllers/CategoryDocumentController.js';
import CategoryDocument from '../../src/core/Models/CategoryDocument.js';
import mongoose from 'mongoose';

describe('Category Document API Integration', () => {
    beforeEach(async () => {
        await CategoryDocument.deleteMany({});
    });

    it('should create a new category document', async () => {
        const req = {
            jsonBody: { name: 'Passport', category_slug: 'international' }
        };

        const response = await CategoryDocumentController.create(req);
        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data.data.name).toBe('Passport');
        expect(data.data.category_slug).toBe('international');
        expect(data.data.isActive).toBe(true);

        const count = await CategoryDocument.countDocuments();
        expect(count).toBe(1);
    });

    it('should fetch all category documents', async () => {
        await CategoryDocument.create([
            { name: 'Doc A', category_slug: 'domestic' },
            { name: 'Doc B', category_slug: 'domestic' },
            { name: 'Doc C', category_slug: 'international' }
        ]);

        const req = {
            url: '/api/admin/category-documents',
            headers: {
                get: (key) => 'localhost'
            }
        };

        const response = await CategoryDocumentController.getAll(req);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.data.docs.length).toBe(3);
        expect(data.data.totalDocs).toBe(3);
    });

    it('should filter category documents by category_slug', async () => {
        await CategoryDocument.create([
            { name: 'Doc A', category_slug: 'domestic' },
            { name: 'Doc B', category_slug: 'domestic' },
            { name: 'Doc C', category_slug: 'international' }
        ]);

        const req = {
            url: '/api/admin/category-documents?category_slug=domestic',
            headers: {
                get: (key) => 'localhost'
            }
        };

        const response = await CategoryDocumentController.getAll(req);
        const data = await response.json();
        
        expect(data.data.docs.length).toBe(2);
        expect(data.data.docs[0].category_slug).toBe('domestic');
    });

    it('should fetch a document by ID', async () => {
        const doc = await CategoryDocument.create({ name: 'Unique Doc', category_slug: 'all' });

        const req = {};
        const params = { id: doc._id.toString() };

        const response = await CategoryDocumentController.getById(req, { params });
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.data.name).toBe('Unique Doc');
    });

    it('should output 404 when document not found', async () => {
        const req = {};
        const params = { id: new mongoose.Types.ObjectId().toString() };

        const response = await CategoryDocumentController.getById(req, { params });
        expect(response.status).toBe(404);
    });

    it('should update a category document', async () => {
        const doc = await CategoryDocument.create({ name: 'Old Doc', category_slug: 'all' });

        const req = {
            jsonBody: { name: 'New Doc', isMandatory: true }
        };
        const params = { id: doc._id.toString() };

        const response = await CategoryDocumentController.update(req, { params });
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.data.name).toBe('New Doc');
        expect(data.data.isMandatory).toBe(true);

        const updatedDoc = await CategoryDocument.findById(doc._id);
        expect(updatedDoc.name).toBe('New Doc');
        expect(updatedDoc.isMandatory).toBe(true);
    });

    it('should delete a category document', async () => {
        const doc = await CategoryDocument.create({ name: 'To Delete', category_slug: 'all' });

        const req = {};
        const params = { id: doc._id.toString() };

        const response = await CategoryDocumentController.delete(req, { params });
        expect(response.status).toBe(200);

        const count = await CategoryDocument.countDocuments();
        expect(count).toBe(0);
    });
});
