import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Traveller/ReviewService.js', () => ({
    __esModule: true,
    default: {
        getMyReviews: jest.fn(),
        submitReview: jest.fn(),
        deleteReview: jest.fn()
    }
}));

const { default: ReviewController } = await import('@/core/Http/Controllers/Traveller/ReviewController.js');
const { default: ReviewService } = await import('@/core/Services/Traveller/ReviewService.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Traveller ReviewController Unit Tests', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getMyReviews', () => {
        it('should return reviews submitted by the user', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            ReviewService.getMyReviews.mockResolvedValue([{ _id: 'r1', rating: 5 }]);

            const response = await ReviewController.getMyReviews(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.reviews).toHaveLength(1);
        });
    });

    describe('submitReview', () => {
        it('should submit a review and return 201 Created', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            mockReq.payload = { rating: 5, comment: 'Amazing trek!' };

            ReviewService.submitReview.mockResolvedValue({ _id: 'r1', rating: 5 });

            const response = await ReviewController.submitReview(mockReq, { params: { bookingId: 'b123' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(body.data._id).toBe('r1');
            expect(ReviewService.submitReview).toHaveBeenCalledWith('u123', {
                bookingId: 'b123',
                rating: 5,
                comment: 'Amazing trek!'
            });
        });
    });

    describe('deleteReview', () => {
        it('should delete a review successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            ReviewService.deleteReview.mockResolvedValue(true);

            const response = await ReviewController.deleteReview(mockReq, { params: { id: 'r1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });
    });
});
