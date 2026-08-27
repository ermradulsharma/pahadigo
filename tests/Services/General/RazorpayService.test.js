import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({
        razorpay: {
            key_id: 'rzp_test_key',
            key_secret: 'rzp_test_secret',
            webhook_secret: 'rzp_webhook_secret'
        }
    })
}));

const { default: RazorpayService } = await import('@/core/Services/General/RazorpayService.js');

describe('General RazorpayService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
        process.env.RAZORPAY_KEY_SECRET = 'rzp_test_secret';
        process.env.RAZORPAY_WEBHOOK_SECRET = 'rzp_webhook_secret';
    });

    describe('verifySignature', () => {
        test('should return true for valid signature', async () => {
            const crypto = await import('crypto');
            const validSig = crypto.createHmac('sha256', 'rzp_test_secret').update('order123|pay123').digest('hex');
            const result = await RazorpayService.verifySignature('order123', 'pay123', validSig);
            expect(result).toBe(true);
        });

        test('should return false for invalid signature', async () => {
            const result = await RazorpayService.verifySignature('order123', 'pay123', 'bad_sig');
            expect(result).toBe(false);
        });
    });

    describe('verifyWebhookSignature', () => {
        test('should verify webhook signature successfully', async () => {
            const body = JSON.stringify({ event: 'payment.captured' });
            const secret = 'rzp_webhook_secret';
            const crypto = await import('crypto');
            const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

            const result = await RazorpayService.verifyWebhookSignature(body, signature, secret);
            expect(result).toBe(true);
        });
    });
});
