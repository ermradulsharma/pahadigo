import { jest } from '@jest/globals';

const mockNotificationService = {
    _processInvoiceDelivery: jest.fn()
};

const mockPushNotificationService = {
    sendToDevice: jest.fn()
};

const mockOCRService = {
    processDocument: jest.fn()
};

const mockVendor = {
    findByIdAndUpdate: jest.fn()
};

jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({
    default: mockNotificationService
}));

jest.unstable_mockModule('@/core/Services/PushNotificationService.js', () => ({
    PushNotificationService: mockPushNotificationService
}));

jest.unstable_mockModule('@/core/Services/Admin/OCRService.js', () => ({
    default: mockOCRService
}));

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: mockVendor
}));

jest.unstable_mockModule('@/core/Lib/logger.js', () => ({
    getLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() })
}));

const { default: QStashWebhookController } = await import('@/core/Http/Controllers/General/QStashWebhookController.js');
const { HTTP_STATUS } = await import('@/core/Constants/index.js');

describe('Industry Standard: QStashWebhookController', () => {
    let mockReq;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            requestId: 'req_qstash_123',
            validData: null
        };
    });

    it('[Validation] should reject empty or invalid payload with 400', async () => {
        mockReq.validData = {};
        const res = await QStashWebhookController.processJob(mockReq);
        expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    it('[Job: generate_invoice] should trigger invoice delivery and return 200', async () => {
        mockReq.validData = {
            type: 'generate_invoice',
            payload: { email: 'user@example.com', bookingId: 'b_101', role: 'traveller' }
        };
        mockNotificationService._processInvoiceDelivery.mockResolvedValue(true);

        const res = await QStashWebhookController.processJob(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockNotificationService._processInvoiceDelivery).toHaveBeenCalledWith('user@example.com', 'b_101', 'traveller');
    });

    it('[Job: send_push_notification] should send push notification via PushNotificationService', async () => {
        mockReq.validData = {
            type: 'send_push_notification',
            payload: { token: 'device_fcm_token', notification: { title: 'Booking Confirmed' }, data: { id: '1' } }
        };
        mockPushNotificationService.sendToDevice.mockResolvedValue({ success: true, messageId: 'msg_999' });

        const res = await QStashWebhookController.processJob(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockPushNotificationService.sendToDevice).toHaveBeenCalledWith(
            'device_fcm_token',
            { title: 'Booking Confirmed' },
            { id: '1' }
        );
    });

    it('[Job: process_ocr] should parse base64 document and update vendor', async () => {
        mockReq.validData = {
            type: 'process_ocr',
            payload: {
                vendorId: 'vendor_101',
                docType: 'panCard',
                imageBufferBase64: Buffer.from('dummy image content').toString('base64')
            }
        };
        mockOCRService.processDocument.mockResolvedValue({ identifiedId: 'ABCDE1234F', text: 'INCOME TAX DEPT' });
        mockVendor.findByIdAndUpdate.mockResolvedValue(true);

        const res = await QStashWebhookController.processJob(mockReq);
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(mockOCRService.processDocument).toHaveBeenCalled();
        expect(mockVendor.findByIdAndUpdate).toHaveBeenCalledWith('vendor_101', expect.anything());
    });

    it('[Validation] should reject unknown job type with 400', async () => {
        mockReq.validData = {
            type: 'unknown_pipeline',
            payload: {}
        };
        const res = await QStashWebhookController.processJob(mockReq);
        expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });
});
