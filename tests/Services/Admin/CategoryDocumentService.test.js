import { jest } from '@jest/globals';

const mockSave = jest.fn();
jest.unstable_mockModule('@/core/Models/CategoryDocument.js', () => ({
    default: class CategoryDocument {
        constructor(data) { Object.assign(this, data); }
        save = mockSave
        static find = jest.fn()
        static countDocuments = jest.fn()
        static findById = jest.fn()
        static findByIdAndDelete = jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    RESPONSE_MESSAGES: { VENDOR: { DOCUMENT_NOT_FOUND: 'Document not found' } }
}));

jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    default: { get: jest.fn(), set: jest.fn(), deletePattern: jest.fn() }
}));

jest.unstable_mockModule('@/core/Helpers/AppError.js', () => ({
    default: class AppError extends Error {
        constructor(msg, code) { super(msg); this.code = code; }
    }
}));

const { default: CategoryDocumentService } = await import('@/core/Services/Admin/CategoryDocumentService.js');
const { default: CategoryDocument } = await import('@/core/Models/CategoryDocument.js');
const { default: CacheService } = await import('@/core/Services/CacheService.js');

describe('CategoryDocumentService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const chainableMock = (data) => {
        const mock = {};
        mock.sort = jest.fn().mockReturnValue(mock);
        mock.skip = jest.fn().mockReturnValue(mock);
        mock.limit = jest.fn().mockReturnValue(mock);
        mock.lean = jest.fn().mockResolvedValue(data);
        return mock;
    };

    describe('create', () => {
        it('should create a document and clear cache', async () => {
            mockSave.mockResolvedValue();
            const result = await CategoryDocumentService.create({ name: 'Doc1' });
            expect(result.name).toBe('Doc1');
            expect(mockSave).toHaveBeenCalled();
            expect(CacheService.deletePattern).toHaveBeenCalledWith('admin:category-docs:*');
        });
    });

    describe('getAll', () => {
        it('should return from cache', async () => {
            CacheService.get.mockResolvedValue({ cached: true });
            const result = await CategoryDocumentService.getAll();
            expect(result.cached).toBe(true);
        });

        it('should fetch and cache if not in cache', async () => {
            CacheService.get.mockResolvedValue(null);
            CategoryDocument.find.mockReturnValue(chainableMock([{ _id: 'd1' }]));
            CategoryDocument.countDocuments.mockResolvedValue(1);

            const result = await CategoryDocumentService.getAll({ status: 'active' }, 1, 10);
            expect(result.docs.length).toBe(1);
            expect(CacheService.set).toHaveBeenCalled();
        });
    });

    describe('getById', () => {
        it('should return document', async () => {
            CategoryDocument.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'd1' }) });
            const result = await CategoryDocumentService.getById('d1');
            expect(result._id).toBe('d1');
        });

        it('should throw if not found', async () => {
            CategoryDocument.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
            await expect(CategoryDocumentService.getById('d1')).rejects.toThrow('Document not found');
        });
    });

    describe('update', () => {
        it('should update document and clear cache', async () => {
            const mockDoc = { _id: 'd1', name: 'Old', save: mockSave };
            CategoryDocument.findById.mockResolvedValue(mockDoc);
            
            const result = await CategoryDocumentService.update('d1', { name: 'New' });
            expect(result.name).toBe('New');
            expect(mockSave).toHaveBeenCalled();
            expect(CacheService.deletePattern).toHaveBeenCalledWith('admin:category-docs:*');
        });

        it('should throw if not found', async () => {
            CategoryDocument.findById.mockResolvedValue(null);
            await expect(CategoryDocumentService.update('d1', {})).rejects.toThrow('Document not found');
        });
    });

    describe('delete', () => {
        it('should delete document and clear cache', async () => {
            CategoryDocument.findByIdAndDelete.mockResolvedValue({ _id: 'd1' });
            await CategoryDocumentService.delete('d1');
            expect(CategoryDocument.findByIdAndDelete).toHaveBeenCalledWith('d1');
            expect(CacheService.deletePattern).toHaveBeenCalledWith('admin:category-docs:*');
        });
    });
});
