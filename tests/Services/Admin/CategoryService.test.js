import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Category.js', () => ({
    default: function(data) {
        this.save = jest.fn().mockResolvedValue(data);
        Object.assign(this, data);
    }
}));

// Re-defining for finding
const MockCategory = await import('@/core/Models/Category.js').then(m => m.default);
MockCategory.findById = jest.fn();
MockCategory.find = jest.fn(() => ({ sort: jest.fn().mockResolvedValue([]) }));

const { default: CategoryService } = await import('@/services/Admin/CategoryService.js');

describe('Industry Standard: Admin CategoryService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[createCategory]', () => {
        it('[Success] should create a new category', async () => {
            const data = { name: 'New Cat', slug: 'new-cat' };
            const result = await CategoryService.createCategory(data);
            expect(result.name).toBe('New Cat');
        });
    });

    describe('[updateCategory]', () => {
        it('[Success] should update existing category and generate slug if name changed', async () => {
            const mockCat = {
                name: 'Old',
                save: jest.fn().mockImplementation(function() { return Promise.resolve(this); })
            };
            MockCategory.findById.mockResolvedValue(mockCat);

            const result = await CategoryService.updateCategory('id1', { name: 'New Name' });

            expect(result.name).toBe('New Name');
            expect(result.slug).toBe('new-name');
            expect(mockCat.save).toHaveBeenCalled();
        });
    });
});
