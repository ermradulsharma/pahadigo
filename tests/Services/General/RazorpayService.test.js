import { jest } from '@jest/globals';
import RazorpayService from '@/services/General/RazorpayService.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

describe('General RazorpayService', () => {
    let mockOrdersCreate;

    beforeEach(() => {
        mockOrdersCreate = jest.fn();
        // Since RazorpayService is already initialized with a real instance,
        // we can just mock its internal razorpay object's methods.
        jest.spyOn(RazorpayService.razorpay.orders, 'create').mockImplementation(mockOrdersCreate);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        test('should create order with correct amount in paise', async () => {
            const mockOrder = { id: 'order123' };
            mockOrdersCreate.mockResolvedValue(mockOrder);

            const result = await RazorpayService.createOrder(100.50, 'receipt123');

            expect(mockOrdersCreate).toHaveBeenCalledWith({
                amount: 10050,
                currency: 'INR',
                receipt: 'receipt123'
            });
            expect(result).toEqual(mockOrder);
        });
    });

    describe('verifySignature', () => {
        test('should return true for valid signature', () => {
            const orderId = 'order123';
            const paymentId = 'pay123';
            const secret = 'test_key_secret';
            const body = orderId + "|" + paymentId;
            const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

            const result = RazorpayService.verifySignature(orderId, paymentId, signature);

            expect(result).toBe(true);
        });

        test('should return false for invalid signature', () => {
            const result = RazorpayService.verifySignature('order123', 'pay123', 'bad_sig');
            expect(result).toBe(false);
        });
    });

    describe('verifyWebhookSignature', () => {
        test('should return true for valid webhook signature', async () => {
            const body = { event: 'payment.captured' };
            const secret = 'test_webhook_secret';
            const signature = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');

            const result = await RazorpayService.verifyWebhookSignature(body, signature);

            expect(result).toBe(true);
        });
    });
});
