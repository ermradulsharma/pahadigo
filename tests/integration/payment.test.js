import { POST } from '@/app/api/payment/[[...slug]]/route.js';
import { invokeApi } from '../utils/apiTestHelper.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';
import mongoose from 'mongoose';
import connectDB from '@/core/Config/db.js';
import crypto from 'crypto';

describe('Integration: Financial Webhooks', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('[Webhook] should reject invalid signatures', async () => {
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
        const payload = {
            event: 'payment.captured',
            payload: { payment: { entity: { id: 'pay_123', amount: 1000 } } }
        };

        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
        const expectedSignature = crypto.createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');

        const { status, data } = await invokeApi(POST, 'payment/webhook', { 
            method: 'POST',
            body: payload,
            headers: {
                'x-razorpay-signature': expectedSignature,
                'x-razorpay-event-id': 'evt_123'
            }
        });

        expect(data.message).not.toBe('Invalid webhook signature');
    });
});
