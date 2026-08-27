import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Services/General/RazorpayService.js', () => ({
    __esModule: true,
    default: {
        createOrder: jest.fn(),
        verifySignature: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/General/BookingService.js', () => ({
    __esModule: true,
    default: {
        getBookingById: jest.fn(),
        updatePaymentStatus: jest.fn()
    }
}));

const { default: PaymentController } = await import('@/core/Http/Controllers/Traveller/PaymentController.js');
const { default: RazorpayService } = await import('@/core/Services/General/RazorpayService.js');
const { default: BookingService } = await import('@/core/Services/General/BookingService.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Traveller PaymentController Unit Tests', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        it('should create Razorpay payment order for booking', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            mockReq.jsonBody = { bookingId: 'b123' };

            const mockBooking = {
                _id: 'b123',
                pricing: { total: 5000 },
                payment: {},
                user: { name: 'Rahul' },
                package: { title: 'Auli Homestay' },
                save: jest.fn().mockResolvedValue(true)
            };

            BookingService.getBookingById.mockResolvedValue(mockBooking);
            RazorpayService.createOrder.mockResolvedValue({ id: 'order_rzp_123', amount: 500000 });

            const response = await PaymentController.createOrder(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.order.id).toBe('order_rzp_123');
            expect(mockBooking.save).toHaveBeenCalled();
        });

        it('should return 401 Unauthorized if user context is missing', async () => {
            mockReq = createMockReq({ user: null });
            const response = await PaymentController.createOrder(mockReq);
            expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        });
    });

    describe('verifyPayment', () => {
        it('should verify Razorpay signature and update booking status', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            mockReq.jsonBody = {
                razorpay_order_id: 'order_1',
                razorpay_payment_id: 'pay_1',
                razorpay_signature: 'sig_1'
            };

            RazorpayService.verifySignature.mockReturnValue(true);
            BookingService.updatePaymentStatus.mockResolvedValue(true);

            const response = await PaymentController.verifyPayment(mockReq);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.data.success).toBe(true);
            expect(BookingService.updatePaymentStatus).toHaveBeenCalledWith('order_1', 'pay_1', 'sig_1');
        });

        it('should return 400 Bad Request if signature validation fails', async () => {
            mockReq = createMockReq({ user: { id: 'u123' } });
            mockReq.jsonBody = {
                razorpay_order_id: 'order_1',
                razorpay_payment_id: 'pay_1',
                razorpay_signature: 'bad_sig'
            };

            RazorpayService.verifySignature.mockReturnValue(false);

            const response = await PaymentController.verifyPayment(mockReq);
            expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });
});
