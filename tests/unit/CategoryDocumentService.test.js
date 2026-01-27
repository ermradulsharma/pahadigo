import CategoryDocumentService from '../../src/services/CategoryDocumentService.js';
import CategoryDocument from '../../src/models/CategoryDocument.js';

describe('CategoryDocumentService', () => {
    describe('create', () => {
        it('should create a new document record', async () => {
            const data = {
                name: 'PAN Card',
                category_slug: 'trekking',
                isRequired: true
            };
            const doc = await CategoryDocumentService.create(data);
            expect(doc).toBeDefined();
            expect(doc.name).toBe(data.name);
            expect(doc.category_slug).toBe(data.category_slug);
        });
    });

    describe('getAll', () => {
        it('should return paginated documents', async () => {
            await CategoryDocument.create({ name: 'Doc 1', category_slug: 'cat1' });
            await CategoryDocument.create({ name: 'Doc 2', category_slug: 'cat1' });
            await CategoryDocument.create({ name: 'Doc 3', category_slug: 'cat2' });

            const result = await CategoryDocumentService.getAll({ category_slug: 'cat1' });
            expect(result.docs.length).toBe(2);
            expect(result.totalDocs).toBe(2);
        });
    });

    describe('update', () => {
        it('should update an existing document', async () => {
            const doc = await CategoryDocument.create({ name: 'Old Name', category_slug: 'slug' });
            const updated = await CategoryDocumentService.update(doc._id.toString(), { name: 'New Name' });
            expect(updated.name).toBe('New Name');
        });
    });
});
