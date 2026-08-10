import { jest } from '@jest/globals';

const mockQuery = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    then: jest.fn(function(resolve) {
        resolve(this._resolvedValue || []);
    }),
    _resolveWith: function(value) {
        this._resolvedValue = value;
        return this;
    }
};

jest.unstable_mockModule('@/models/Review.js', () => ({
    default: {
        find: jest.fn(() => mockQuery),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn()
    }
}));

jest.unstable_mockModule('@/services/Admin/AuditService.js', () => ({
    default: { logAction: jest.fn() }
}));

const { default: ReviewService } = await import('@/services/Admin/ReviewService.js');
const { default: Review } = await import('@/models/Review.js');
const { default: AuditService } = await import('@/services/Admin/AuditService.js');

describe('Industry Standard: ReviewService Business Logic Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockQuery._resolvedValue = [];
    });

    describe('[getAllReviews]', () => {
        it('[Success] should fetch all reviews with population', async () => {
            const mockReviews = [{ _id: 'r1', comment: 'Great' }];
            mockQuery._resolveWith(mockReviews);

            const result = await ReviewService.getAllReviews();
            
            expect(Review.find).toHaveBeenCalled();
            expect(mockQuery.populate).toHaveBeenCalledWith('user', 'name');
            expect(mockQuery.populate).toHaveBeenCalledWith('vendor', 'businessName');
            expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
            expect(result).toEqual(mockReviews);
        });
    });

    describe('[toggleReviewVisibility]', () => {
        it('[Success] should update review visibility and log action', async () => {
            const reviewId = 'r1';
            const req = { user: { id: 'admin1' } };
            const updatedReview = { _id: reviewId, isVisible: true };
            Review.findByIdAndUpdate.mockResolvedValue(updatedReview);

            const result = await ReviewService.toggleReviewVisibility(reviewId, true, req);

            expect(Review.findByIdAndUpdate).toHaveBeenCalledWith(reviewId, { isVisible: true }, { new: true });
            expect(AuditService.logAction).toHaveBeenCalledWith('admin1', 'UPDATE_VISIBILITY', 'REVIEW', reviewId, { isVisible: true }, req);
            expect(result).toEqual(updatedReview);
        });

        it('[Success] should update visibility without logging if req is missing', async () => {
            const reviewId = 'r1';
            Review.findByIdAndUpdate.mockResolvedValue({ _id: reviewId, isVisible: false });

            await ReviewService.toggleReviewVisibility(reviewId, false);

            expect(AuditService.logAction).not.toHaveBeenCalled();
        });
    });

    describe('[deleteReview]', () => {
        it('[Success] should delete review and log action', async () => {
            const reviewId = 'r1';
            const req = { user: { id: 'admin1' } };
            Review.findByIdAndDelete.mockResolvedValue({ _id: reviewId });

            const result = await ReviewService.deleteReview(reviewId, req);

            expect(AuditService.logAction).toHaveBeenCalledWith('admin1', 'DELETE', 'REVIEW', reviewId, {}, req);
            expect(Review.findByIdAndDelete).toHaveBeenCalledWith(reviewId);
            expect(result).toBeDefined();
        });
    });
});
