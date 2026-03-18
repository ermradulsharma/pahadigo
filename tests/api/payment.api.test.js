import { jest } from '@jest/globals';
import PaymentController from '../../src/core/Http/Controllers/PaymentController.js';
import BookingService from '../../src/core/Services/BookingService.js';
import RazorpayService from '../../src/core/Services/RazorpayService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../../src/core/Constants/index.js';

describe('PaymentController Test Suite', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createOrder', () => {
        it('should return 401 if user is not authenticated', async () => {
            const req = { user: null };
            const res = await PaymentController.createOrder(req);
            expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        });

        it('should return 404 if booking is not found', async () => {
            jest.spyOn(BookingService, 'getBookingById').mockResolvedValue(null);
            
            const req = { user: { id: '123' }, jsonBody: { bookingId: 'nonexistent' } };
            const res = await PaymentController.createOrder(req);
            
            expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        it('should successfully create order and return 200', async () => {
            const mockBooking = { _id: 'bId', totalPrice: 1000, razorpay: {}, save: jest.fn() };
            jest.spyOn(BookingService, 'getBookingById').mockResolvedValue(mockBooking);
            jest.spyOn(RazorpayService, 'createOrder').mockResolvedValue({ id: 'order_123' });

            const req = { user: { id: '123' }, jsonBody: { bookingId: 'bId' } };
            const res = await PaymentController.createOrder(req);
            
            expect(res.status).toBe(HTTP_STATUS.OK);
            const data = await res.json();
            expect(data.data.order.id).toBe('order_123');
            expect(mockBooking.save).toHaveBeenCalled();
            expect(mockBooking.razorpay.orderId).toBe('order_123');
        });

        it('should handle internal errors and return 500', async () => {
            jest.spyOn(BookingService, 'getBookingById').mockRejectedValue(new Error('DB error'));
            
            const req = { user: { id: '123' }, jsonBody: { bookingId: 'bId' } };
            const res = await PaymentController.createOrder(req);
            
            expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
        
        it('handles async await req.json fallback', async () => {
             const mockBooking = { _id: 'bId', totalPrice: 1000, razorpay: {}, save: jest.fn() };
             jest.spyOn(BookingService, 'getBookingById').mockResolvedValue(mockBooking);
             jest.spyOn(RazorpayService, 'createOrder').mockResolvedValue({ id: 'order_123' });

             const req = { user: { id: '123' }, json: async () => ({ bookingId: 'bId' }) };
             const res = await PaymentController.createOrder(req);
             expect(res.status).toBe(HTTP_STATUS.OK);
        });
    });

    describe('verifyPayment', () => {
        it('should verify signature and return 200', async () => {
            jest.spyOn(RazorpayService, 'verifySignature').mockReturnValue(true);
            jest.spyOn(BookingService, 'updatePaymentStatus').mockResolvedValue(true);

            const req = { jsonBody: { razorpay_order_id: 'o_1', razorpay_payment_id: 'p_1', razorpay_signature: 's_1' } };
            const res = await PaymentController.verifyPayment(req);
            
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(BookingService.updatePaymentStatus).toHaveBeenCalledWith('o_1', 'p_1', 's_1');
        });

        it('should return 400 on invalid signature', async () => {
            jest.spyOn(RazorpayService, 'verifySignature').mockReturnValue(false);

            const req = { jsonBody: { razorpay_order_id: 'o_1', razorpay_payment_id: 'p_1', razorpay_signature: 'invalid' } };
            const res = await PaymentController.verifyPayment(req);
            
            expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('should return 404 on booking mismatch internal error', async () => {
            jest.spyOn(RazorpayService, 'verifySignature').mockReturnValue(true);
            jest.spyOn(BookingService, 'updatePaymentStatus').mockRejectedValue(new Error('Booking order mismatch'));

            const req = { jsonBody: { razorpay_order_id: 'o_1', razorpay_payment_id: 'p_1', razorpay_signature: 's_1' } };
            const res = await PaymentController.verifyPayment(req);
            
            expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        it('should return 500 on generic internal error', async () => {
            jest.spyOn(RazorpayService, 'verifySignature').mockReturnValue(true);
            jest.spyOn(BookingService, 'updatePaymentStatus').mockRejectedValue(new Error('Unknown db error'));

            const req = { json: async () => ({ razorpay_order_id: 'o_1', razorpay_payment_id: 'p_1', razorpay_signature: 's_1' }) };
            const res = await PaymentController.verifyPayment(req);
            
            expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('webhook', () => {
        it('should return 400 on invalid webhook signature', async () => {
            jest.spyOn(RazorpayService, 'verifyWebhookSignature').mockResolvedValue(false);
            const req = { headers: { get: () => 'bad_sig' }, jsonBody: {} };
            
            const res = await PaymentController.webhook(req);
            expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('should process order.paid event and return 200', async () => {
            jest.spyOn(RazorpayService, 'verifyWebhookSignature').mockResolvedValue(true);
            jest.spyOn(BookingService, 'updatePaymentStatus').mockResolvedValue(true);

            const req = { 
                headers: { get: () => 'good_sig' }, 
                jsonBody: { 
                    event: 'order.paid', 
                    payload: { 
                        order: { entity: { id: 'o_1' } }, 
                        payment: { entity: { id: 'p_1' } } 
                    } 
                } 
            };
            
            const res = await PaymentController.webhook(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(BookingService.updatePaymentStatus).toHaveBeenCalledWith('o_1', 'p_1', 'WEBHOOK_VERIFIED');
        });

        it('should process payment.failed event without error and return 200', async () => {
            jest.spyOn(RazorpayService, 'verifyWebhookSignature').mockResolvedValue(true);

            const req = { 
                headers: { get: () => 'good_sig' }, 
                json: async () => ({ 
                    event: 'payment.failed', 
                    payload: { 
                        payment: { entity: { order_id: 'o_1' } } 
                    } 
                }) 
            };
            
            const res = await PaymentController.webhook(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
        });

        it('should return 500 on internal webhook error', async () => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(RazorpayService, 'verifyWebhookSignature').mockRejectedValue(new Error('Internal throw'));

            const req = { headers: { get: () => 'sig' }, jsonBody: {} };
            const res = await PaymentController.webhook(req);
            
            expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });
});
