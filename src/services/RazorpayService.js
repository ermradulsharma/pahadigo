import Razorpay from 'razorpay';
import crypto from 'crypto';

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

const instance = (key_id && key_secret) ? new Razorpay({
    key_id,
    key_secret
}) : null;

class RazorpayService {
    async createOrder(amount, receiptId) {
        if (!instance) {
            throw new Error('Razorpay is not configured. Check environment variables.');
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

    verifySignature(orderId, paymentId, signature) {
        const secret = process.env.RAZORPAY_KEY_SECRET;
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

export default new RazorpayService();
