import { jest } from '@jest/globals';
import ReviewService from '@/core/Services/Traveller/ReviewService.js';
import Review from '@/core/Models/Review.js';
import Booking from '@/core/Models/Booking.js';
import BusinessService from '@/core/Services/Vendor/BusinessService.js';

describe('Traveller Review Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Booking, 'findOne');
        jest.spyOn(Review, 'findOne');
        jest.spyOn(Review, 'findOneAndUpdate');
        jest.spyOn(BusinessService, 'calculateTrustBadge').mockResolvedValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('submitReview should allow review if booking is completed', async () => {
        const userId = 'user123';
        const data = { bookingId: 'book123', rating: 5, comment: 'Great!' };
        
        Booking.findOne.mockResolvedValue({
            _id: 'book123',
            user: userId,
            vendor: 'vendor123',
            package: 'pkg123',
            status: 'completed'
        });

        Review.findOneAndUpdate.mockResolvedValue({ _id: 'rev123', ...data });

        const result = await ReviewService.submitReview(userId, data);
        
        expect(result.rating).toBe(5);
        expect(Review.findOneAndUpdate).toHaveBeenCalled();
        expect(BusinessService.calculateTrustBadge).toHaveBeenCalledWith('vendor123');
    });

    test('submitReview should fail if booking is not completed', async () => {
        const userId = 'user123';
        const data = { bookingId: 'book123', rating: 5 };
        
        Booking.findOne.mockResolvedValue({
            _id: 'book123',
            user: userId,
            status: 'confirmed' // Not completed
        });

        await expect(ReviewService.submitReview(userId, data))
            .rejects.toThrow('You can only review a booking that has been completed.');
    });

    test('submitReview should update if already exists', async () => {
        const userId = 'user123';
        const data = { bookingId: 'book123', rating: 4 };
        
        Booking.findOne.mockResolvedValue({
            _id: 'book123',
            user: userId,
            status: 'completed'
        });

        Review.findOneAndUpdate.mockResolvedValue({ _id: 'rev123', rating: 4 });

        const result = await ReviewService.submitReview(userId, data);
        expect(result.rating).toBe(4);
        expect(Review.findOneAndUpdate).toHaveBeenCalled();
    });
});
