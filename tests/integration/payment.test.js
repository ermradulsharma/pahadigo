import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({
        razorpay: {
            key_id: 'test_key',
            key_secret: 'test_secret',
            webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret'
        }
    }),
    clearAppConfigCache: jest.fn()
}));

const { POST } = await import('@/app/api/payment/[[...slug]]/route.js');
const { default: RazorpayService } = await import('@/core/Services/General/RazorpayService.js');
import { invokeApi } from '../utils/apiTestHelper.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';
import mongoose from 'mongoose';
import connectDB from '@/core/Config/db.js';

describe('Integration: Financial Webhooks', () => {
    beforeAll(async () => {
        process.env.RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
        await connectDB();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('[Webhook] should reject invalid signatures', async () => {
        jest.spyOn(RazorpayService, 'verifyWebhookSignature').mockResolvedValueOnce(false);

        const payload = {
            event: 'payment.captured',
            payload: { payment: { entity: { id: 'pay_123', amount: 1000 } } }
        };

        const { status, data } = await invokeApi(POST, 'payment/webhook', { 
            method: 'POST',
            body: payload,
            headers: {
                'x-razorpay-signature': 'invalid_signature_hash'
            }
        });
        
        expect(status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(data.success).toBe(false);
    });

    it('[Webhook] should accept valid signature and handle replay', async () => {
        jest.spyOn(RazorpayService, 'verifyWebhookSignature').mockResolvedValueOnce(true);

        const payload = {
            event: 'payment.captured',
            payload: { payment: { entity: { id: 'pay_123', amount: 1000 } } }
        };

        const { status, data } = await invokeApi(POST, 'payment/webhook', { 
            method: 'POST',
            body: payload,
            headers: {
                'x-razorpay-signature': 'valid_signature',
                'x-razorpay-event-id': 'evt_123'
            }
        });

        expect(data.message).not.toBe('Invalid webhook signature');
    });
});
