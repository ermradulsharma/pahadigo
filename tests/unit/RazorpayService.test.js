import { jest } from '@jest/globals';
import crypto from 'crypto';

let mockOrdersCreate = jest.fn().mockResolvedValue({ id: 'order_123', amount: 50000 });

jest.unstable_mockModule('razorpay', () => {
    return {
        default: jest.fn().mockImplementation(() => ({
            orders: { create: mockOrdersCreate }
        }))
    };
});

let mockConfig = { razorpay: { key_id: 'test_id', key_secret: 'test_sec', webhook_secret: 'wh_sec' } };
jest.unstable_mockModule('../../src/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockImplementation(async () => mockConfig)
}));

const RazorpayService = (await import('../../src/core/Services/RazorpayService.js')).default;

describe('RazorpayService Test Suite', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockConfig = { razorpay: { key_id: 'test_id', key_secret: 'test_sec', webhook_secret: 'wh_sec' } };
        mockOrdersCreate = jest.fn().mockResolvedValue({ id: 'order_123', amount: 50000 });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('_getInstance', () => {
        it('should return instance if keys exist', async () => {
            const instance = await RazorpayService._getInstance();
            expect(instance).not.toBeNull();
        });

        it('should return null if keys are missing', async () => {
            mockConfig = { razorpay: {} };
            const instance = await RazorpayService._getInstance();
            expect(instance).toBeNull();
        });
    });

    describe('createOrder', () => {
        it('should throw error if config missing', async () => {
            mockConfig = { razorpay: {} };
            await expect(RazorpayService.createOrder(500, 'rec_1')).rejects.toThrow();
        });

        it('should create order successfully', async () => {
            const order = await RazorpayService.createOrder(500, 'rec_1');
            expect(order.id).toBe('order_123');
            expect(mockOrdersCreate).toHaveBeenCalledWith({
                amount: 50000,
                currency: "INR",
                receipt: 'rec_1'
            });
        });

        it('should throw error if creation fails', async () => {
            mockOrdersCreate.mockRejectedValue(new Error('Razorpay Error'));
            await expect(RazorpayService.createOrder(500, 'rec_1')).rejects.toThrow('Razorpay Error');
        });
    });

    describe('verifySignature', () => {
        it('should return false if secret is missing', async () => {
            mockConfig = { razorpay: { key_secret: null } };
            const isValid = await RazorpayService.verifySignature('order_1', 'pay_1', 'sig');
            expect(isValid).toBe(false);
        });

        it('should return false for invalid signature', async () => {
            const isValid = await RazorpayService.verifySignature('order_1', 'pay_1', 'a'.repeat(64));
            expect(isValid).toBe(false);
        });

        it('should return true for valid signature', async () => {
            const secret = 'test_sec';
            const orderId = 'order_1';
            const paymentId = 'pay_1';
            const hmac = crypto.createHmac('sha256', secret);
            hmac.update(orderId + "|" + paymentId);
            const validSig = hmac.digest('hex');

            const isValid = await RazorpayService.verifySignature(orderId, paymentId, validSig);
            expect(isValid).toBe(true);
        });
    });

    describe('verifyWebhookSignature', () => {
        it('should return false if webhook secret is missing', async () => {
            mockConfig = { razorpay: { webhook_secret: null } };
            const isValid = await RazorpayService.verifyWebhookSignature({ event: 'test' }, 'sig');
            expect(isValid).toBe(false);
        });

        it('should return false for invalid webhook signature', async () => {
            const isValid = await RazorpayService.verifyWebhookSignature({ event: 'test' }, 'b'.repeat(64));
            expect(isValid).toBe(false);
        });

        it('should return true for valid webhook signature', async () => {
            const secret = 'wh_sec';
            const body = { event: 'payment.captured' };
            const expectedSig = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');

            const isValid = await RazorpayService.verifyWebhookSignature(body, expectedSig);
            expect(isValid).toBe(true);
        });
    });
});
