import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * RazorpayService - Centralized service for payment operations using Razorpay.
 */
class RazorpayService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'test_key_id',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_key_secret',
        });
    }

    async createOrder(amount, receipt, dynamicConfig = null) {
        let client = this.razorpay;

        // If DB-driven config is provided, override the client
        if (dynamicConfig?.key_id && dynamicConfig?.key_secret) {
            client = new Razorpay({
                key_id: dynamicConfig.key_id,
                key_secret: dynamicConfig.key_secret,
            });
        }

        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit
            currency: "INR",
            receipt: receipt,
        };
        return await client.orders.create(options);
    }

    verifySignature(orderId, paymentId, signature, dynamicConfig = null) {
        const secret = dynamicConfig?.key_secret || process.env.RAZORPAY_KEY_SECRET || 'test_key_secret';
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body.toString())
            .digest('hex');
        return expectedSignature === signature;
    }

    async createRefund(paymentId, amount, dynamicConfig = null) {
        let client = this.razorpay;
        if (dynamicConfig?.key_id && dynamicConfig?.key_secret) {
            client = new Razorpay({
                key_id: dynamicConfig.key_id,
                key_secret: dynamicConfig.key_secret,
            });
        }

        const options = {
            amount: Math.round(amount * 100),
            notes: { reason: "Admin initiated refund via platform" }
        };
        return await client.payments.refund(paymentId, options);
    }

    async verifyWebhookSignature(body, signature, secret = null) {
        const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(typeof body === 'string' ? body : JSON.stringify(body))
            .digest('hex');
        return expectedSignature === signature;
    }
}

export default new RazorpayService();
