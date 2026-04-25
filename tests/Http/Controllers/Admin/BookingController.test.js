import { jest } from '@jest/globals';

// Mock Services
const mockBookingService = { 
    getAllBookings: jest.fn(),
    getBookingById: jest.fn(),
    payoutBooking: jest.fn(),
    refundBooking: jest.fn(),
    generateAndSendInvoice: jest.fn()
};

jest.unstable_mockModule('@/core/Services/Admin/BookingService.js', () => ({ default: mockBookingService }));

const { default: BookingController } = await import('@/core/Http/Controllers/Admin/BookingController.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');

describe('Industry Standard: BookingController API Controller', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            url: 'http://localhost/admin/bookings',
            user: { id: 'admin_123' },
            payload: {}
        };
    });

    it('[Fetch All] should return list of bookings', async () => {
        mockBookingService.getAllBookings.mockResolvedValue({ bookings: [], total: 0 });
        const response = await BookingController.getAllBookings(mockReq);
        expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it('[Show] should return single booking details', async () => {
        mockBookingService.getBookingById.mockResolvedValue({ _id: '123' });
        const response = await BookingController.show(mockReq, { params: { id: '123' } });
        expect(response.status).toBe(HTTP_STATUS.OK);
    });

    it('[Payout] should execute payout action', async () => {
        mockReq.payload = { bookingId: '123', amount: 5000 };
        mockBookingService.payoutBooking.mockResolvedValue({ _id: '123' });
        const response = await BookingController.payoutBooking(mockReq);
        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(mockBookingService.payoutBooking).toHaveBeenCalled();
    });

    it('[Refund] should execute refund action', async () => {
        mockReq.payload = { bookingId: '123', amount: 5000 };
        mockBookingService.refundBooking.mockResolvedValue({ _id: '123' });
        const response = await BookingController.refundBooking(mockReq);
        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(mockBookingService.refundBooking).toHaveBeenCalled();
    });

    it('[Invoice] should trigger invoice pipeline', async () => {
        mockBookingService.generateAndSendInvoice.mockResolvedValue({ _id: '123' });
        const response = await BookingController.sendInvoice(mockReq, { params: { id: '123' } });
        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(mockBookingService.generateAndSendInvoice).toHaveBeenCalledWith('123');
    });
});
