import CategoryController from '@/controllers/General/CategoryController';
import CategoryService from '@/core/Services/General/CategoryService.js';
import { createMockReq } from '../../../Helpers/testUtils.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { jest } from '@jest/globals';

// Mock the CategoryService
jest.unstable_mockModule('@/core/Services/General/CategoryService.js', () => ({
    default: {
        getAllCategories: jest.fn(),
        getCategoryById: jest.fn()
    }
}));

// Re-import the controller to ensure it uses the mocked service
const { default: MockedCategoryController } = await import('@/controllers/General/CategoryController');

describe('Industry Standard: CategoryController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAll', () => {
        it('[Success] should fetch all categories successfully', async () => {
            const mockCategories = [{ id: '1', name: 'Adventure' }, { id: '2', name: 'Relaxation' }];
            CategoryService.getAllCategories = jest.fn().mockResolvedValue(mockCategories);

            const req = createMockReq();
            const response = await MockedCategoryController.getAll(req);
            const body = await response.json();

            expect(CategoryService.getAllCategories).toHaveBeenCalled();
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.CATEGORY.FETCHED);
            expect(body.data).toEqual(mockCategories);
        });

        it('[Failure] should handle internal server errors gracefully', async () => {
            CategoryService.getAllCategories = jest.fn().mockRejectedValue(new Error('Database connection failed'));

            const req = createMockReq();
            const response = await MockedCategoryController.getAll(req);
            const body = await response.json();

            expect(CategoryService.getAllCategories).toHaveBeenCalled();
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            expect(body.message).toBe(RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        });
    });

    describe('getById', () => {
        it('[Success] should fetch category by ID successfully', async () => {
            const mockCategory = { id: '1', name: 'Adventure' };
            CategoryService.getCategoryById = jest.fn().mockResolvedValue(mockCategory);

            const req = createMockReq();
            const response = await MockedCategoryController.getById(req, { params: { id: '1' } });
            const body = await response.json();

            expect(CategoryService.getCategoryById).toHaveBeenCalledWith('1');
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.CATEGORY.FETCHED);
            expect(body.data).toEqual(mockCategory);
        });

        it('[Validation] should return BAD_REQUEST if ID is missing', async () => {
            const req = createMockReq();
            const response = await MockedCategoryController.getById(req, { params: {} });
            const body = await response.json();

            expect(CategoryService.getCategoryById).not.toHaveBeenCalled();
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
            expect(body.message).toBe(RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);
        });

        it('[Failure] should return NOT_FOUND if category does not exist', async () => {
            CategoryService.getCategoryById = jest.fn().mockRejectedValue(new Error('Category not found'));

            const req = createMockReq();
            const response = await MockedCategoryController.getById(req, { params: { id: 'invalid-id' } });
            const body = await response.json();

            expect(CategoryService.getCategoryById).toHaveBeenCalledWith('invalid-id');
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
            expect(body.message).toBe(RESPONSE_MESSAGES.CATEGORY.NOT_FOUND);
        });
    });
});
