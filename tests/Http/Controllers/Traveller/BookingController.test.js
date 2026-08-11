import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => ({
    getBookingBy: jest.fn(),
    getManyBy: jest.fn(),
    getPackageItemById: jest.fn()
}));

jest.unstable_mockModule('@/core/Services/Traveller/BookingService.js', () => ({
    default: {
        initiateBooking: jest.fn(),
        refundBooking: jest.fn(),
        initializePayment: jest.fn(),
        verifyBookingPayment: jest.fn(),
        getBookingOTP: jest.fn(),
        reportDispute: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/cloudinary.js', () => ({
    uploadToCloudinary: jest.fn()
}));

const { default: BookingController } = await import('@/core/Http/Controllers/Traveller/BookingController.js');
const { default: BookingService } = await import('@/core/Services/Traveller/BookingService.js');
const queryHelpers = await import('@/core/Helpers/queryHelpers.js');
const { uploadToCloudinary } = await import('@/core/Helpers/cloudinary.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

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
            
            queryHelpers.getManyBy.mockResolvedValue(mockBookings);

            const response = await BookingController.getBookings(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual(mockBookings);
            expect(queryHelpers.getManyBy).toHaveBeenCalledWith(
                expect.any(Function),
                expect.objectContaining({ user: 'user123' }),
                '',
                expect.any(Array),
                expect.any(Object)
            );
        });

        test('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'user1' } });
            queryHelpers.getManyBy.mockRejectedValue(new Error('DB Error'));
            const response = await BookingController.getBookings(mockReq);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('initiateBooking', () => {
        test('should create a new booking', async () => {
            mockReq = createMockReq({ user: { id: 'user123' } });
            mockReq.payload = { adults: 2 };
            BookingService.initiateBooking.mockResolvedValue({ _id: 'booking1' });

            const response = await BookingController.initiateBooking(mockReq, { params: { id: 'item1' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.CREATED);
            expect(body.data._id).toBe('booking1');
            expect(BookingService.initiateBooking).toHaveBeenCalledWith({
                userId: 'user123', body: { adults: 2 }, itemId: 'item1'
            });
        });

        test('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'user123' } });
            BookingService.initiateBooking.mockRejectedValue(new Error('fail'));
            const response = await BookingController.initiateBooking(mockReq, { params: { id: 'item1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('getBookingById', () => {
        test('should return booking details if owner', async () => {
            const mockBooking = { _id: 'booking123', user: 'user123' };
            mockReq = createMockReq({ user: { id: 'user123' } });
            queryHelpers.getBookingBy.mockResolvedValue(mockBooking);

            const response = await BookingController.getBookingById(mockReq, { params: { id: 'booking123' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data).toEqual(mockBooking);
        });

        test('should return 404 if booking not found', async () => {
            mockReq = createMockReq({ user: { id: 'user1' } });
            queryHelpers.getBookingBy.mockResolvedValue(null);
            const response = await BookingController.getBookingById(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        test('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'user1' } });
            queryHelpers.getBookingBy.mockRejectedValue(new Error('fail'));
            const response = await BookingController.getBookingById(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('cancelBooking', () => {
        test('should cancel booking successfully', async () => {
            const mockBooking = { _id: 'booking123', user: 'user123', status: 'confirmed' };
            mockReq = createMockReq({ user: { id: 'user123' } });
            queryHelpers.getBookingBy.mockResolvedValue(mockBooking);
            BookingService.refundBooking.mockResolvedValue({ ...mockBooking, status: 'cancelled' });

            const response = await BookingController.cancelBooking(mockReq, { params: { id: 'booking123' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        test('should return 400 if already cancelled', async () => {
            const mockBooking = { _id: 'booking123', user: 'user123', status: 'cancelled' };
            mockReq = createMockReq({ user: { id: 'user123' } });
            queryHelpers.getBookingBy.mockResolvedValue(mockBooking);

            const response = await BookingController.cancelBooking(mockReq, { params: { id: 'booking123' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        test('should return 404 if not found', async () => {
            mockReq = createMockReq({ user: { id: 'user123' } });
            queryHelpers.getBookingBy.mockResolvedValue(null);
            const response = await BookingController.cancelBooking(mockReq, { params: { id: 'booking123' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        test('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'user1' } });
            queryHelpers.getBookingBy.mockRejectedValue(new Error('fail'));
            const response = await BookingController.cancelBooking(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('initializePayment', () => {
        test('should initialize payment successfully', async () => {
            mockReq = createMockReq({ user: { id: 'user123' } });
            BookingService.initializePayment.mockResolvedValue({ orderId: 'ord_1' });

            const response = await BookingController.initializePayment(mockReq, { params: { id: 'booking1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        test('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'user123' } });
            BookingService.initializePayment.mockRejectedValue(new Error('fail'));
            const response = await BookingController.initializePayment(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('verifyPayment', () => {
        test('should verify payment successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { sig: 'abc' };
            BookingService.verifyBookingPayment.mockResolvedValue({ _id: 'booking1', status: 'confirmed' });

            const response = await BookingController.verifyPayment(mockReq, { params: { id: 'booking1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        test('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BookingService.verifyBookingPayment.mockRejectedValue(new Error('fail'));
            const response = await BookingController.verifyPayment(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('getBookingOTP', () => {
        test('should get otp successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BookingService.getBookingOTP.mockResolvedValue({ type: 'Start OTP', otp: '123456' });

            const response = await BookingController.getBookingOTP(mockReq, { params: { id: 'booking1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        test('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BookingService.getBookingOTP.mockRejectedValue(new Error('fail'));
            const response = await BookingController.getBookingOTP(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('reportDispute', () => {
        test('should upload evidence array and create dispute', async () => {
            const mockFile = { size: 100, name: 'proof.jpg' };
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { reason: 'other', evidence: [mockFile, 'http://url.com/img.jpg'] };
            uploadToCloudinary.mockResolvedValue('http://uploaded.com/proof.jpg');
            BookingService.reportDispute.mockResolvedValue({ _id: 'disp1' });

            const response = await BookingController.reportDispute(mockReq, { params: { id: 'booking1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(uploadToCloudinary).toHaveBeenCalled();
            expect(BookingService.reportDispute).toHaveBeenCalledWith('booking1', 'u1', expect.objectContaining({
                evidenceUrls: ['http://uploaded.com/proof.jpg', 'http://url.com/img.jpg']
            }));
        });

        test('should upload single evidence file and create dispute', async () => {
            const mockFile = { size: 100, name: 'proof.jpg' };
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { reason: 'other', evidence: mockFile };
            uploadToCloudinary.mockResolvedValue('http://uploaded.com/proof.jpg');
            BookingService.reportDispute.mockResolvedValue({ _id: 'disp1' });

            const response = await BookingController.reportDispute(mockReq, { params: { id: 'booking1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        test('should create dispute without files', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { reason: 'other', evidenceUrls: ['url1'] };
            BookingService.reportDispute.mockResolvedValue({ _id: 'disp1' });

            const response = await BookingController.reportDispute(mockReq, { params: { id: 'booking1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(BookingService.reportDispute).toHaveBeenCalledWith('booking1', 'u1', expect.objectContaining({
                evidenceUrls: ['url1']
            }));
        });

        test('should handle errors', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            mockReq.payload = { reason: 'other' };
            BookingService.reportDispute.mockRejectedValue(new Error('fail'));
            const response = await BookingController.reportDispute(mockReq, { params: { id: '1' } });
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });
});
