import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: {
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

const { default: seedCategories } = await import('@/database/Seeders/categorySeeder.js');
const { default: Category } = await import('@/core/Models/Category.js');

describe('Industry Standard: categorySeeder Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should seed default categories', async () => {
        Category.findOne.mockResolvedValue(null);
        Category.create.mockResolvedValue({});

        const result = await seedCategories();

        expect(Category.create).toHaveBeenCalled();
        expect(result.added).toBeGreaterThan(0);
    });

    it('[Success] should skip existing categories', async () => {
        Category.findOne.mockResolvedValue({ name: 'Existing' });
        Category.create.mockResolvedValue({});

        const result = await seedCategories();

        expect(Category.create).not.toHaveBeenCalled();
        expect(result.existing).toBeGreaterThan(0);
    });
});
