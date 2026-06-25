import { jest } from '@jest/globals';

const mockVerifyWebhookSignature = jest.fn();
const mockUpdatePaymentStatus = jest.fn();

jest.unstable_mockModule('@/core/Services/General/RazorpayService.js', () => ({
    default: {
        verifyWebhookSignature: mockVerifyWebhookSignature
    }
}));

jest.unstable_mockModule('@/core/Services/General/BookingService.js', () => ({
    default: {
        updatePaymentStatus: mockUpdatePaymentStatus
    }
}));

const { default: PaymentController } = await import('@/controllers/General/PaymentController');

const buildWebhookRequest = (body, signature = 'valid-signature') => ({
    headers: new Headers({ 'x-razorpay-signature': signature }),
    json: jest.fn().mockResolvedValue(body)
});

const parseResponse = async (response) => ({
    status: response.status,
    body: await response.json()
});

describe('Industry Standard: PaymentController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockVerifyWebhookSignature.mockResolvedValue(true);
        mockUpdatePaymentStatus.mockResolvedValue({ _id: 'booking_123' });
    });

    it('[Success] should expose valid HTTP handler methods', () => {
        expect(PaymentController).toBeDefined();
        expect(typeof PaymentController.webhook).toBe('function');
    });

    it('[Security] rejects webhook requests with invalid Razorpay signatures', async () => {
        mockVerifyWebhookSignature.mockResolvedValue(false);

        const response = await PaymentController.webhook(buildWebhookRequest({ event: 'order.paid', payload: {} }, 'bad-signature'));
        const result = await parseResponse(response);

        expect(result.status).toBe(400);
        expect(result.body.success).toBe(false);
        expect(mockUpdatePaymentStatus).not.toHaveBeenCalled();
    });

    it('[Validation] rejects paid webhook events without payment identifiers', async () => {
        const response = await PaymentController.webhook(buildWebhookRequest({
            event: 'order.paid',
            payload: { order: { entity: {} }, payment: { entity: {} } }
        }));
        const result = await parseResponse(response);

        expect(result.status).toBe(400);
        expect(result.body.message).toBe('Invalid payment webhook payload');
        expect(mockUpdatePaymentStatus).not.toHaveBeenCalled();
    });

    it('[Success] verifies order.paid webhook and updates booking payment once', async () => {
        const response = await PaymentController.webhook(buildWebhookRequest({
            event: 'order.paid',
            payload: {
                order: { entity: { id: 'order_123' } },
                payment: { entity: { id: 'pay_123' } }
            }
        }));
        const result = await parseResponse(response);

        expect(result.status).toBe(200);
        expect(result.body.data).toEqual({ received: true });
        expect(mockUpdatePaymentStatus).toHaveBeenCalledWith('order_123', 'pay_123', 'WEBHOOK_VERIFIED');
    });

    it('[Compatibility] supports payment.captured payloads that only include payment.order_id', async () => {
        const response = await PaymentController.webhook(buildWebhookRequest({
            event: 'payment.captured',
            payload: {
                payment: { entity: { id: 'pay_456', order_id: 'order_456' } }
            }
        }));
        const result = await parseResponse(response);

        expect(result.status).toBe(200);
        expect(mockUpdatePaymentStatus).toHaveBeenCalledWith('order_456', 'pay_456', 'WEBHOOK_VERIFIED');
    });
});
