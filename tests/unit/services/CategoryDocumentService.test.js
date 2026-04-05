import CategoryDocumentService from '../../../src/core/Services/CategoryDocumentService.js';
import CategoryDocument from '../../../src/core/Models/CategoryDocument.js';
import { jest } from '@jest/globals';

describe('CategoryDocumentService Test Suite', () => {
    let mockDocId;

    beforeEach(async () => {
        const doc = await CategoryDocumentService.create({
            name: 'Aadhar Card',
            category_slug: 'all',
            document_slug: 'aadhar'
        });
        mockDocId = doc._id;
    });

    it('should create a document successfully', async () => {
        const doc = await CategoryDocumentService.create({
            name: 'PAN Card',
            category_slug: 'all',
            document_slug: 'pan'
        });
        expect(doc.name).toBe('PAN Card');
    });

    it('should return paginated results', async () => {
        await CategoryDocument.create({ name: 'Doc 2', category_slug: 'test', type: 'image', url: 'http://test2.com' });
        await CategoryDocument.create({ name: 'Doc 3', category_slug: 'test', type: 'image', url: 'http://test3.com' });
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
