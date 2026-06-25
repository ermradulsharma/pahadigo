import { jest } from '@jest/globals';
import BookingController from '@/core/Http/Controllers/Traveller/BookingController.js';
import Booking from '@/core/Models/Booking.js';
import BookingService from '@/core/Services/Traveller/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import { createMockReq } from '../../../Helpers/testUtils.js';

describe('Traveller BookingController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('getBookings', () => {
        test('should return all bookings for authenticated traveller', async () => {
            const mockBookings = [{ _id: 'booking123' }];
            mockReq = createMockReq({ user: { id: 'user123', role: 'traveller' } });
            
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue(mockBookings)
            };
            const spy = jest.spyOn(Booking, 'find').mockReturnValue(mockQuery);

            const response = await BookingController.getBookings(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.BOOKING.FETCHED_HISTORICAL);
            expect(body.data).toEqual(mockBookings);
            expect(spy).toHaveBeenCalledWith({ user: 'user123' });
        });
    });

    describe('getBookingById', () => {
        test('should return booking details if owner', async () => {
            const mockBooking = { _id: 'booking123', user: 'user123' };
            mockReq = createMockReq({ 
                user: { id: 'user123', role: 'traveller' },
                params: { id: 'booking123' }
            });

            const mockQuery = {
                lean: jest.fn().mockResolvedValue(mockBooking)
            };
            jest.spyOn(Booking, 'findOne').mockReturnValue(mockQuery);

            const response = await BookingController.getBookingById(mockReq, { params: { id: 'booking123' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual(mockBooking);
        });

        test('should return 404 if booking not found or not owner', async () => {
            mockReq = createMockReq({ 
                user: { id: 'user123', role: 'traveller' },
                params: { id: 'booking123' }
            });

            const mockQuery = {
                lean: jest.fn().mockResolvedValue(null)
            };
            jest.spyOn(Booking, 'findOne').mockReturnValue(mockQuery);

            const response = await BookingController.getBookingById(mockReq, { params: { id: 'booking123' } });
            
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('cancelBooking', () => {
        test('should cancel booking successfully', async () => {
            const mockBooking = { _id: 'booking123', user: 'user123', status: 'confirmed' };
            mockReq = createMockReq({ 
                user: { id: 'user123', role: 'traveller' },
                params: { id: 'booking123' }
            });

            const mockQuery = {
                lean: jest.fn().mockResolvedValue(mockBooking)
            };
            jest.spyOn(Booking, 'findOne').mockReturnValue(mockQuery);
            jest.spyOn(BookingService, 'refundBooking').mockResolvedValue({ ...mockBooking, status: 'cancelled' });

            const response = await BookingController.cancelBooking(mockReq, { params: { id: 'booking123' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.BOOKING.CANCELLED);
        });

        test('should return 400 if booking is already cancelled', async () => {
            const mockBooking = { _id: 'booking123', user: 'user123', status: 'cancelled' };
            mockReq = createMockReq({ 
                user: { id: 'user123', role: 'traveller' },
                params: { id: 'booking123' }
            });

            const mockQuery = {
                lean: jest.fn().mockResolvedValue(mockBooking)
            };
            jest.spyOn(Booking, 'findOne').mockReturnValue(mockQuery);

            const response = await BookingController.cancelBooking(mockReq, { params: { id: 'booking123' } });
            
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });
});
