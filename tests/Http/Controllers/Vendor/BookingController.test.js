import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/Vendor/BusinessService.js', () => ({
    default: {
        getBusinessByUserId: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Vendor/BookingService.js', () => ({
    default: {
        verifyStartOTP: jest.fn(),
        verifyEndOTP: jest.fn(),
        syncOfflineVerifications: jest.fn(),
        updateBookingStatus: jest.fn(),
        logTimelineEvent: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => ({
    getBookingById: jest.fn(),
    getManyBy: jest.fn()
}));

const { default: BookingController } = await import('@/core/Http/Controllers/Vendor/BookingController.js');
const { default: BusinessService } = await import('@/core/Services/Vendor/BusinessService.js');
const { default: BookingService } = await import('@/core/Services/Vendor/BookingService.js');
const { getBookingById: qhGetBookingById, getManyBy: qhGetManyBy } = await import('@/core/Helpers/queryHelpers.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Vendor BookingController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('OTP Verification', () => {
        it('verifyStartOTP should verify successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } }, { otp: '123' });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            BookingService.verifyStartOTP.mockResolvedValue({});

            const response = await BookingController.verifyStartOTP(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(BookingService.verifyStartOTP).toHaveBeenCalledWith('b1', 'v1', '123');
        });

        it('verifyStartOTP should return 404 if vendor not found', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } }, { otp: '123' });
            BusinessService.getBusinessByUserId.mockResolvedValue(null);
            const response = await BookingController.verifyStartOTP(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        it('verifyEndOTP should verify successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } }, { otp: '456' });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            BookingService.verifyEndOTP.mockResolvedValue({});

            const response = await BookingController.verifyEndOTP(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        it('syncOfflineOTPs should sync successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } }, { syncData: [] });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            BookingService.syncOfflineVerifications.mockResolvedValue([]);

            const response = await BookingController.syncOfflineOTPs(mockReq);
            expect(response.status).toBe(HTTP_STATUS.OK);
        });
    });

    describe('getBookings', () => {
        it('should return bookings successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            qhGetManyBy.mockResolvedValue([]);

            const response = await BookingController.getBookings(mockReq);
            expect(response.status).toBe(HTTP_STATUS.OK);
        });
    });

    describe('getBookingById', () => {
        it('should return booking if owner', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            qhGetBookingById.mockResolvedValue({ vendor: { _id: 'v1' } });

            const response = await BookingController.getBookingById(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });

        it('should return 404 if not owner', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            qhGetBookingById.mockResolvedValue({ vendor: { _id: 'other_vendor' } });

            const response = await BookingController.getBookingById(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
        });
    });

    describe('updateBookingStatus', () => {
        it('should update status successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } }, { status: 'confirmed' });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1' });
            BookingService.updateBookingStatus.mockResolvedValue({});

            const response = await BookingController.updateBookingStatus(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });
    });

    describe('addTimelineEvent', () => {
        it('should log timeline event successfully', async () => {
            mockReq = createMockReq({ user: { id: 'u1' } }, { title: 'Trek Started', description: 'Group reached basecamp' });
            BusinessService.getBusinessByUserId.mockResolvedValue({ _id: 'v1', user: 'u1' });
            BookingService.logTimelineEvent.mockResolvedValue([]);

            const response = await BookingController.addTimelineEvent(mockReq, { params: { id: 'b1' } });
            expect(response.status).toBe(HTTP_STATUS.OK);
        });
    });
});
