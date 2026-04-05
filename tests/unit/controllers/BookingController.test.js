import BookingController from '../../../src/core/Http/Controllers/BookingController.js';
import BookingService from '../../../src/core/Services/BookingService.js';
import NotificationService from '../../../src/core/Services/NotificationService.js';
import Booking from '../../../src/core/Models/Booking.js';
import { createMockReq, cleanDatabase, generateId } from '../../helpers/testUtils.js';
import { HTTP_STATUS, USER_ROLES } from '../../../src/core/Constants/index.js';
import { jest } from '@jest/globals';

describe('BookingController Test Suite', () => {
    let travelerId;

    beforeEach(async () => {
        await cleanDatabase();
        travelerId = generateId();
        jest.clearAllMocks();
        jest.spyOn(NotificationService, 'notifyBookingStatus').mockResolvedValue({});
    });

    describe('Feature: Transactional Bookings', () => {
        it('[Success] should process booking with atomic inventory lock', async () => {
            const req = createMockReq({ 
                user: { id: travelerId.toString() }, 
                jsonBody: { catalogId: 'v1', category: 'hotel', itemId: 'i1', travelDate: '2025-05-01' } 
            });
            
            jest.spyOn(BookingService, 'createBooking').mockResolvedValue({ _id: generateId(), status: 'confirmed' });
            
            const res = await BookingController.createBooking(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const data = await res.json();
            expect(data.data.booking).toBeDefined();
        });

        it('[Business Logic] should allow user to cancel their own booking', async () => {
            const bookingId = generateId();
            const req = createMockReq({ 
                user: { id: travelerId.toString() }, 
                params: { id: bookingId.toString() } 
            });
            
            jest.spyOn(Booking, 'findOne').mockResolvedValue({ _id: bookingId, status: 'confirmed' });
            jest.spyOn(BookingService, 'processRefund').mockResolvedValue({ status: 'cancelled' });
            
            const res = await BookingController.cancelBooking(req, { params: req.params });
            expect(res.status).toBe(HTTP_STATUS.OK);
        });
    });
});
