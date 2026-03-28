import PaymentController from '../../src/core/Http/Controllers/PaymentController.js';
import BookingService from '../../src/core/Services/BookingService.js';
import RazorpayService from '../../src/core/Services/RazorpayService.js';
import { createMockReq, cleanDatabase, generateId } from '../helpers/testUtils.js';
import { HTTP_STATUS, USER_ROLES } from '../../src/core/Constants/index.js';
import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('Industry Standard: Payment & Gateway API', () => {
    let travelerId;

    beforeEach(async () => {
        await cleanDatabase();
        travelerId = generateId();
        jest.clearAllMocks();
    });

    describe('Feature: Order Creation', () => {
        it('[Auth] should reject unauthenticated order requests', async () => {
            const req = createMockReq({ user: null });
            const res = await PaymentController.createOrder(req);
            expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
        });

        it('[Success] should initialize Razorpay order for valid booking', async () => {
            const bookingId = generateId();
            const req = createMockReq({ 
                user: { id: travelerId.toString() }, 
                jsonBody: { bookingId: bookingId.toString() } 
            });
            
            const mockBooking = { _id: bookingId, totalPrice: 1000, razorpay: {}, save: jest.fn() };
            jest.spyOn(BookingService, 'getBookingById').mockResolvedValue(mockBooking);
            jest.spyOn(RazorpayService, 'createOrder').mockResolvedValue({ id: 'order_123' });
            
            const res = await PaymentController.createOrder(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            
            const body = await res.json();
            expect(body.data.order.id).toBe('order_123');
        });
    });

    describe('Feature: Payment Verification', () => {
        it('[Integrity] should verify cryptographic signature and update status', async () => {
            const req = createMockReq({ 
                jsonBody: { razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: 's1' } 
            });
            
            jest.spyOn(RazorpayService, 'verifySignature').mockReturnValue(true);
            jest.spyOn(BookingService, 'updatePaymentStatus').mockResolvedValue(true);
            
            const res = await PaymentController.verifyPayment(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
        });
    });

    describe('Feature: Gateway Webhooks', () => {
        it('[Security] should block webhooks with invalid signatures', async () => {
            const req = createMockReq({ 
                headers: { get: () => 'invalid-sig' },
                jsonBody: { event: 'order.paid' } 
            });
            
            jest.spyOn(RazorpayService, 'verifyWebhookSignature').mockResolvedValue(false);
            const res = await PaymentController.webhook(req);
            expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });

        it('[Async] should process verified paid events asynchronously', async () => {
            const req = createMockReq({ 
                headers: { get: () => 'valid-sig' },
                jsonBody: { 
                    event: 'order.paid', 
                    payload: { order: { entity: { id: 'o1' } }, payment: { entity: { id: 'p1' } } } 
                } 
            });
            
            jest.spyOn(RazorpayService, 'verifyWebhookSignature').mockResolvedValue(true);
            jest.spyOn(BookingService, 'updatePaymentStatus').mockResolvedValue(true);
            
            const res = await PaymentController.webhook(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
        });
    });
});
