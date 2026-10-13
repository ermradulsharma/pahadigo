import { jest } from '@jest/globals';

const { evaluateCategoryDocumentStatus } = await import('@/core/Helpers/categoryHelper.js');

describe('categoryHelper Utility Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should evaluate not_uploaded status when required documents are missing', () => {
        const category = { _id: 'cat_1', name: 'Homestay', slug: 'homestay' };
        const categoryRequirements = [
            { category_slug: 'homestay', slug: 'property-registration', name: 'Property Registration Certificate' }
        ];
        const uploadedDocs = [];

        const result = evaluateCategoryDocumentStatus(category, uploadedDocs, categoryRequirements);
        expect(result).toBeDefined();
        expect(result.id).toBe('cat_1');
        expect(result.name).toBe('Homestay');
        expect(result.documentStatus).toBe('not_uploaded');
        expect(result.documents).toHaveLength(1);
        expect(result.documents[0].status).toBe('not_uploaded');
    });

    it('should evaluate verified status when all required documents are approved', () => {
        const category = { _id: 'cat_2', name: 'Cab Service', slug: 'cab-service' };
        const categoryRequirements = [
            { category_slug: 'cab-service', slug: 'commercial-permit', name: 'Commercial Taxi Permit' }
        ];
        const uploadedDocs = [
            { category_slug: 'cab-service', document_slug: 'commercial-permit', status: 'approved', url: 'https://cloudinary.com/permit.pdf' }
        ];

        const result = evaluateCategoryDocumentStatus(category, uploadedDocs, categoryRequirements);
        expect(result.documentStatus).toBe('verified');
        expect(result.documents[0].status).toBe('verified');
        expect(result.documents[0].url).toBe('https://cloudinary.com/permit.pdf');
    });

    it('should evaluate rejected status when any document has rejection reason', () => {
        const category = { _id: 'cat_3', name: 'Trek Guide', slug: 'trek-guide' };
        const categoryRequirements = [
            { category_slug: 'trek-guide', slug: 'mountaineering-cert', name: 'Mountaineering Certificate' }
        ];
        const uploadedDocs = [
            { category_slug: 'trek-guide', document_slug: 'mountaineering-cert', status: 'rejected', rejection_reason: 'Expired certificate' }
        ];

        const result = evaluateCategoryDocumentStatus(category, uploadedDocs, categoryRequirements);
        expect(result.documentStatus).toBe('rejected');
        expect(result.documents[0].status).toBe('rejected');
        expect(result.documents[0].rejectReason).toBe('Expired certificate');
    });
});
