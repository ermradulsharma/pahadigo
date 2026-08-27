import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Traveller/BookingService.js', () => ({
    __esModule: true,
    default: {
        initiateBooking: jest.fn(),
        refundBooking: jest.fn(),
        initializePayment: jest.fn(),
        verifyBookingPayment: jest.fn(),
        getBookingOTP: jest.fn(),
        reportDispute: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => ({
    getBookingBy: jest.fn(),
    getManyBy: jest.fn(),
    getPackageItemById: jest.fn(),
    getById: jest.fn(),
    getBy: jest.fn(),
    getUserBy: jest.fn(),
    getUserById: jest.fn(),
    getBusinessBy: jest.fn(),
    getBusinessById: jest.fn(),
    getBusinessByUserId: jest.fn(),
    getBookingById: jest.fn(),
    getPackageBy: jest.fn(),
    getPackageById: jest.fn(),
    getCategoryBy: jest.fn(),
    getCategoryById: jest.fn(),
    getCategoryBySlug: jest.fn()
}));

const { default: BookingController } = await import('@/core/Http/Controllers/Traveller/BookingController.js');
const { default: BookingService } = await import('@/core/Services/Traveller/BookingService.js');
const { getBookingBy, getManyBy } = await import('@/core/Helpers/queryHelpers.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Traveller BookingController Unit Tests', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getBookings', () => {
        it('should return list of historical bookings for user', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            getManyBy.mockResolvedValue([
                { _id: 'b1', user: { _id: 'u123' }, vendor: { _id: 'v1' }, verification: {} }
            ]);

            const response = await BookingController.getBookings(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.success).toBe(true);
        });
    });

    describe('initiateBooking', () => {
        it('should initiate booking and return 201 Created', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            mockReq.payload = { startDate: '2026-09-01', endDate: '2026-09-05' };
            BookingService.initiateBooking.mockResolvedValue({ _id: 'b1', status: 'pending' });

            const response = await BookingController.initiateBooking(mockReq, { params: { id: 'item1' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(body.data._id).toBe('b1');
            expect(BookingService.initiateBooking).toHaveBeenCalledWith({
                userId: 'u123',
                body: mockReq.payload,
                itemId: 'item1'
            });
        });
    });

    describe('getBookingById', () => {
        it('should return booking details if owner', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            getBookingBy.mockResolvedValue({ _id: 'b1', user: 'u123', vendor: { _id: 'v1' }, verification: {} });

            const response = await BookingController.getBookingById(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        it('should return 404 if booking not found', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            getBookingBy.mockResolvedValue(null);

            const response = await BookingController.getBookingById(mockReq, { params: { id: 'b999' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('cancelBooking', () => {
        it('should cancel booking and process refund', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            getBookingBy.mockResolvedValue({ _id: 'b1', status: 'confirmed' });
            BookingService.refundBooking.mockResolvedValue({ _id: 'b1', status: 'cancelled' });

            const response = await BookingController.cancelBooking(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(BookingService.refundBooking).toHaveBeenCalledWith('b1', mockReq);
        });

        it('should return 400 if booking is already cancelled', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            getBookingBy.mockResolvedValue({ _id: 'b1', status: 'cancelled' });

            const response = await BookingController.cancelBooking(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });
});
