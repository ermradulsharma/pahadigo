import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getAppConfig } from '@/lib/appConfig';

class RazorpayService {
    async _getInstance() {
        const config = await getAppConfig();
        const { key_id, key_secret } = config.razorpay;

        if (key_id && key_secret) {
            return new Razorpay({
                key_id,
                key_secret
            });
        }
        return null;
    }

    async createOrder(amount, receiptId) {
        const instance = await this._getInstance();
        if (!instance) {
            throw new Error('Razorpay is not configured. Check environment variables or Settings.');
        }
        const options = {
            amount: amount * 100, // amount in paisa
            currency: "INR",
            receipt: receiptId
        };
        try {
            const order = await instance.orders.create(options);
            return order;
        } catch (error) {
            console.error('Razorpay Order Error:', error);
            throw error;
        }
    }

    async verifySignature(orderId, paymentId, signature) {
        const config = await getAppConfig();
        const secret = config.razorpay.key_secret;

        if (!secret) {
            console.error('RAZORPAY_KEY_SECRET is missing');
            return false;
        }
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(orderId + "|" + paymentId);
        const generated_signature = hmac.digest('hex');
        return generated_signature === signature;
    }
}

const razorpayService = new RazorpayService();
export default razorpayService;
