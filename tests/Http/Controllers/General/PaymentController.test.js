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

jest.unstable_mockModule('@/core/Models/WebhookEvent.js', () => ({
    default: {
        findOne: jest.fn(),
        create: jest.fn()
    }
}));

const { default: PaymentController } = await import('@/core/Http/Controllers/General/PaymentController.js');
const { default: WebhookEvent } = await import('@/core/Models/WebhookEvent.js');

const buildWebhookRequest = (body, signature = 'valid-signature', eventId = null) => {
    const headers = new Headers({ 'x-razorpay-signature': signature });
    if (eventId) headers.set('x-razorpay-event-id', eventId);
    
    return {
        headers,
        json: jest.fn().mockResolvedValue(body)
    };
};

const parseResponse = async (response) => ({
    status: response.status,
    body: await response.json()
});

describe('PaymentController (General/Public Role)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockVerifyWebhookSignature.mockResolvedValue(true);
        mockUpdatePaymentStatus.mockResolvedValue({ _id: 'booking_123' });
        WebhookEvent.findOne.mockResolvedValue(null);
        WebhookEvent.create.mockResolvedValue({});
    });

    it('should expose valid HTTP handler methods', () => {
        expect(PaymentController).toBeDefined();
        expect(typeof PaymentController.webhook).toBe('function');
    });

    it('rejects webhook requests with invalid Razorpay signatures', async () => {
        mockVerifyWebhookSignature.mockResolvedValue(false);

        const response = await PaymentController.webhook(buildWebhookRequest({ event: 'order.paid', payload: {} }, 'bad-signature'));
        const result = await parseResponse(response);

        expect(result.status).toBe(400);
        expect(result.body.success).toBe(false);
        expect(mockUpdatePaymentStatus).not.toHaveBeenCalled();
    });

    it('returns early if webhook event was already processed (Replay Protection)', async () => {
        WebhookEvent.findOne.mockResolvedValue({ eventId: 'evt_123' });

        const response = await PaymentController.webhook(buildWebhookRequest(
            { event: 'order.paid', payload: {} },
            'valid-signature',
            'evt_123'
        ));
        const result = await parseResponse(response);

        expect(result.status).toBe(200);
        expect(result.body.message).toContain('already processed');
        expect(mockUpdatePaymentStatus).not.toHaveBeenCalled();
        expect(WebhookEvent.create).not.toHaveBeenCalled();
    });

    it('saves new webhook event for idempotency and proceeds', async () => {
        const response = await PaymentController.webhook(buildWebhookRequest({
            event: 'order.paid',
            payload: {
                order: { entity: { id: 'order_123' } },
                payment: { entity: { id: 'pay_123' } }
            }
        }, 'valid', 'evt_new'));
        const result = await parseResponse(response);

        expect(result.status).toBe(200);
        expect(WebhookEvent.create).toHaveBeenCalledWith({ eventId: 'evt_new', gateway: 'razorpay' });
        expect(mockUpdatePaymentStatus).toHaveBeenCalledWith('order_123', 'pay_123', 'WEBHOOK_VERIFIED');
    });

    it('rejects missing or invalid payload structure', async () => {
        const response = await PaymentController.webhook(buildWebhookRequest({ event: 'order.paid' }));
        const result = await parseResponse(response);
        
        expect(result.status).toBe(400);
        expect(result.body.message).toBe('Invalid webhook payload');
    });

    it('rejects paid webhook events without payment identifiers', async () => {
        const response = await PaymentController.webhook(buildWebhookRequest({
            event: 'order.paid',
            payload: { order: { entity: {} }, payment: { entity: {} } }
        }));
        const result = await parseResponse(response);

        expect(result.status).toBe(400);
        expect(result.body.message).toBe('Invalid payment webhook payload');
        expect(mockUpdatePaymentStatus).not.toHaveBeenCalled();
    });

    it('verifies order.paid webhook and updates booking payment once', async () => {
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

    it('supports payment.captured payloads that only include payment.order_id', async () => {
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

    it('handles unexpected internal server errors gracefully', async () => {
        mockVerifyWebhookSignature.mockRejectedValue(new Error('Internal Crypto Error'));

        const response = await PaymentController.webhook(buildWebhookRequest({ event: 'order.paid', payload: {} }));
        const result = await parseResponse(response);

        expect(result.status).toBe(500);
        expect(result.body.message).toBe('Webhook processing failed');
    });
});
