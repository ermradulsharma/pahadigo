import RazorpayService from '../../src/core/Services/RazorpayService.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// We mock the appConfig to inject test Razorpay keys
jest.mock('../../src/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn().mockResolvedValue({
        razorpay: {
            key_id: 'test_key',
            key_secret: 'test_secret'
        }
    })
}));

const mockOrdersCreate = jest.fn();

jest.mock('razorpay', () => {
    return jest.fn().mockImplementation(() => {
        return { orders: { create: mockOrdersCreate } };
    });
});

describe('RazorpayService Test Suite', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create an order by passing the amount in paise', async () => {
        mockOrdersCreate.mockResolvedValue({ id: 'order_123', amount: 50000 });

        const order = await RazorpayService.createOrder(500, 'receipt_1');

        expect(Razorpay).toHaveBeenCalledWith({ key_id: 'test_key', key_secret: 'test_secret' });
        expect(mockOrdersCreate).toHaveBeenCalledWith({
            amount: 50000,
            currency: 'INR',
            receipt: 'receipt_1'
        });
        expect(order.id).toBe('order_123');
    });

    it('should correctly verify a valid webhook/payment signature', async () => {
        const orderId = 'order_valid';
        const paymentId = 'pay_valid';
        const secret = 'test_secret';

        // Generate the valid signature manually
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(orderId + "|" + paymentId);
        const expectedSignature = hmac.digest('hex');

        const isValid = await RazorpayService.verifySignature(orderId, paymentId, expectedSignature);
        expect(isValid).toBe(true);
    });

    it('should reject an invalid signature', async () => {
        const isValid = await RazorpayService.verifySignature('order_invalid', 'pay_invalid', 'bad_signature_string');
        expect(isValid).toBe(false);
    });
});
