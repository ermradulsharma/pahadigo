import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/CategoryDocument.js', () => ({
    default: function(data) {
        this.save = jest.fn().mockResolvedValue(data);
        Object.assign(this, data);
    }
}));

const MockCategoryDocument = await import('@/core/Models/CategoryDocument.js').then(m => m.default);
MockCategoryDocument.find = jest.fn(() => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([])
}));
MockCategoryDocument.countDocuments = jest.fn().mockResolvedValue(0);
MockCategoryDocument.findById = jest.fn();

const { default: CategoryDocumentService } = await import('@/services/Admin/CategoryDocumentService.js');

describe('Industry Standard: Admin CategoryDocumentService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[create]', () => {
        it('[Success] should create a new category document', async () => {
            const data = { name: 'Aadhar', category_slug: 'homestay' };
            const result = await CategoryDocumentService.create(data);
            expect(result.name).toBe('Aadhar');
        });
    });

    describe('[getAll]', () => {
        it('[Success] should return paginated documents', async () => {
            MockCategoryDocument.countDocuments.mockResolvedValue(20);
            const result = await CategoryDocumentService.getAll({}, 1, 10);
            expect(result.totalPages).toBe(2);
            expect(result.page).toBe(1);
        });
    });
});
