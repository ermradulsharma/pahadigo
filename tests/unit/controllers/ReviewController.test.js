import ReviewController from '../../../src/core/Http/Controllers/ReviewController.js';
import Booking from '../../../src/core/Models/Booking.js';
import Review from '../../../src/core/Models/Review.js';
import Package from '../../../src/core/Models/Package.js';
import VendorService from '../../../src/core/Services/VendorService.js';
import { cleanDatabase, generateId, createMockReq } from '../../helpers/testUtils.js';
import { HTTP_STATUS } from '../../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

describe('ReviewController Test Suite', () => {
    let userId, bookingId, pkgId;

    beforeEach(async () => {
        await cleanDatabase();
        userId = generateId();
        bookingId = generateId();
        pkgId = generateId();
        jest.clearAllMocks();
    });

    describe('addReview', () => {
        it('should allow user to submit review for their booking', async () => {
            const req = createMockReq({ 
                user: { id: userId.toString() },
                jsonBody: { bookingId: bookingId.toString(), rating: 5, comment: 'Great!' } 
            });

            const vendorId = generateId();
            const itemId = generateId();
            await Package.create({ _id: pkgId, vendor: vendorId, category: 'hotel', title: 'Test' });
            await Booking.create({ 
                _id: bookingId, 
                user: userId, 
                package: pkgId, 
                vendor: vendorId,
                status: 'completed', 
                travelStartTime: new Date(),
                travelEndTime: new Date(Date.now() + 3600000),
                preferences: { itemId: itemId } 
            });
            
            // Mock Evaluate
            jest.spyOn(VendorService, 'evaluateVendorTrustBadge').mockResolvedValue({});

            const res = await ReviewController.addReview(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const saved = await Review.findOne({ user: userId, package: pkgId });
            expect(saved).toBeDefined();
            expect(saved.rating).toBe(5);
        });

        it('should block multiple reviews for same booking', async () => {
             const req = createMockReq({ 
                user: { id: userId.toString() },
                jsonBody: { bookingId: bookingId.toString(), rating: 5 } 
            });

            const vendorId = generateId();
            const itemId = generateId();
            await Package.create({ _id: pkgId, vendor: vendorId, category: 'hotel', title: 'Test' });
            const booking = await Booking.create({ 
                _id: bookingId, 
                user: userId, 
                package: pkgId, 
                vendor: vendorId,
                status: 'completed',
                travelStartTime: new Date(),
                travelEndTime: new Date(Date.now() + 3600000),
                preferences: { itemId: itemId }
            });

            await Review.create({ 
                user: userId, 
                vendor: vendorId,
                package: pkgId, 
                serviceId: itemId.toString(),
                rating: 5 
            });

            const res = await ReviewController.addReview(req);
            expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });
});
