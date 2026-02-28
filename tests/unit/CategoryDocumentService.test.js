import CategoryDocumentService from '../../src/core/Services/CategoryDocumentService.js';
import CategoryDocument from '../../src/core/Models/CategoryDocument.js';

describe('CategoryDocumentService Test Suite', () => {
    let mockDocId;

    it('should create a document successfully', async () => {
        const doc = await CategoryDocumentService.create({
            name: 'Aadhar Card',
            category_slug: 'all',
            document_slug: 'aadhar'
        });
        mockDocId = doc._id;
        expect(doc.name).toBe('Aadhar Card');
    });

    it('should return paginated results', async () => {
        await CategoryDocumentService.create({ name: 'PAN', category_slug: 'all', document_slug: 'pan' });
        const result = await CategoryDocumentService.getAll({}, 1, 1);
        expect(result.docs.length).toBe(1);
        expect(result.totalDocs).toBeGreaterThan(1);
        expect(result.totalPages).toBe(result.totalDocs);
    });

    it('should retrieve document by ID', async () => {
        const doc = await CategoryDocumentService.getById(mockDocId);
        expect(doc.name).toBe('Aadhar Card');
    });

    it('should update document properties', async () => {
        const updated = await CategoryDocumentService.update(mockDocId, { isMandatory: true });
        expect(updated.isMandatory).toBe(true);
    });

    it('should delete the document', async () => {
        await CategoryDocumentService.delete(mockDocId);
        await expect(CategoryDocumentService.getById(mockDocId)).rejects.toThrow();
    });
});
