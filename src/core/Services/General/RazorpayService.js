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

    async createOrder(amount, receipt) {
        const options = {
            amount: Math.round(amount * 100), // amount in the smallest currency unit
            currency: "INR",
            receipt: receipt,
        };
        return await this.razorpay.orders.create(options);
    }

    verifySignature(orderId, paymentId, signature) {
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_key_secret')
            .update(body.toString())
            .digest('hex');
        return expectedSignature === signature;
    }

    async verifyWebhookSignature(body, signature) {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(body))
            .digest('hex');
        return expectedSignature === signature;
    }
}

export default new RazorpayService();
