import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/CategoryDocument.js', () => ({
    default: {
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

const { default: seedCategoryDocuments } = await import('@/database/Seeders/CategoryDocumentSeeder.js');
const { default: CategoryDocument } = await import('@/core/Models/CategoryDocument.js');

describe('Industry Standard: CategoryDocumentSeeder Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should seed category documents', async () => {
        CategoryDocument.findOne.mockResolvedValue(null);
        CategoryDocument.create.mockResolvedValue({});

        await seedCategoryDocuments();

        expect(CategoryDocument.create).toHaveBeenCalled();
    });

    it('[Success] should update existing documents', async () => {
        const mockDoc = { name: 'Doc', save: jest.fn() };
        CategoryDocument.findOne.mockResolvedValue(mockDoc);

        await seedCategoryDocuments();

        expect(mockDoc.save).toHaveBeenCalled();
    });
});
