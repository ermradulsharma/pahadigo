import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Vendor/CategoryService.js', () => ({
    default: {
        getAssignedCategories: jest.fn(),
        assignCategoryToVendor: jest.fn(),
        removeCategoryFromVendor: jest.fn(),
        getEligibleCategories: jest.fn(),
        getDocuments: jest.fn(),
        getRequirementsBySlug: jest.fn(),
        uploadDocuments: jest.fn(),
        getUploadedDocuments: jest.fn()
    }
}));

const { default: CategoryController } = await import('@/core/Http/Controllers/Vendor/CategoryController.js');
const { default: CategoryService } = await import('@/core/Services/Vendor/CategoryService.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Vendor CategoryController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCategories', () => {
        it('should fetch assigned categories successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getAssignedCategories.mockResolvedValue([{ slug: 'hotel' }]);

            const response = await CategoryController.getCategories(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual([{ slug: 'hotel' }]);
            expect(CategoryService.getAssignedCategories).toHaveBeenCalledWith('u1');
        });

        it('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getAssignedCategories.mockRejectedValue(new Error('err'));
            const response = await CategoryController.getCategories(mockReq);
            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('assignCategory', () => {
        it('should assign a category successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { slug: 'hotel' };
            CategoryService.assignCategoryToVendor.mockResolvedValue({ category: [{ slug: 'hotel' }] });

            const response = await CategoryController.assignCategory(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual([{ slug: 'hotel' }]);
            expect(CategoryService.assignCategoryToVendor).toHaveBeenCalledWith('u1', { slug: 'hotel' });
        });

        it('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.assignCategoryToVendor.mockRejectedValue(new Error('err'));
            const response = await CategoryController.assignCategory(mockReq);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('removeCategory', () => {
        it('should remove a category successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.removeCategoryFromVendor.mockResolvedValue({ category: [] });

            const response = await CategoryController.removeCategory(mockReq, { params: { slug: 'hotel' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(CategoryService.removeCategoryFromVendor).toHaveBeenCalledWith('u1', 'hotel');
        });

        it('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.removeCategoryFromVendor.mockRejectedValue(new Error('err'));
            const response = await CategoryController.removeCategory(mockReq, { params: { slug: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('getEligibleCategories', () => {
        it('should fetch eligible categories', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getEligibleCategories.mockResolvedValue([{ slug: 'camping' }]);

            const response = await CategoryController.getEligibleCategories(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data[0].slug).toBe('camping');
        });

        it('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getEligibleCategories.mockRejectedValue(new Error('err'));
            const response = await CategoryController.getEligibleCategories(mockReq);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('getCategoryDocuments', () => {
        it('should fetch documents successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getDocuments.mockResolvedValue([{ slug: 'fssai' }]);

            const response = await CategoryController.getCategoryDocuments(mockReq, { params: { slug: 'hotel' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data[0].slug).toBe('fssai');
            expect(CategoryService.getDocuments).toHaveBeenCalledWith('u1', 'hotel');
        });

        it('should return 400 if slug missing', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            const response = await CategoryController.getCategoryDocuments(mockReq);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getDocuments.mockRejectedValue(new Error('err'));
            const response = await CategoryController.getCategoryDocuments(mockReq, { params: { slug: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('getCategoryRequirements', () => {
        it('should fetch requirements without assignment check', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getRequirementsBySlug.mockResolvedValue([{ slug: 'fssai' }]);

            const response = await CategoryController.getCategoryRequirements(mockReq, { params: { slug: 'hotel' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(CategoryService.getRequirementsBySlug).toHaveBeenCalledWith('hotel');
        });

        it('should return 400 if slug missing', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            const response = await CategoryController.getCategoryRequirements(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getRequirementsBySlug.mockRejectedValue(new Error('err'));
            const response = await CategoryController.getCategoryRequirements(mockReq, { params: { slug: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('uploadDocuments', () => {
        it('should upload documents successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.uploadDocuments.mockResolvedValue([{ url: 'http://img.com/a.jpg' }]);

            const response = await CategoryController.uploadDocuments(mockReq, { params: { slug: 'hotel' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(CategoryService.uploadDocuments).toHaveBeenCalledWith('u1', 'hotel', mockReq);
        });

        it('should return 400 if slug missing', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = {};
            const response = await CategoryController.uploadDocuments(mockReq, { params: {} });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.uploadDocuments.mockRejectedValue(new Error('err'));
            const response = await CategoryController.uploadDocuments(mockReq, { params: { slug: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('getUploadedDocuments', () => {
        it('should fetch all uploaded documents successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getUploadedDocuments.mockResolvedValue([{ url: 'http://img.com/a.jpg' }]);

            const response = await CategoryController.getUploadedDocuments(mockReq);
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(CategoryService.getUploadedDocuments).toHaveBeenCalledWith('u1');
        });

        it('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            CategoryService.getUploadedDocuments.mockRejectedValue(new Error('err'));
            const response = await CategoryController.getUploadedDocuments(mockReq);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });
});
