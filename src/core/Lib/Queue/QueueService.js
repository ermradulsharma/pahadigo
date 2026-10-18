import { Client } from '@upstash/qstash';
import { getAppConfig } from '../appConfig.js';
import { getLogger } from '@/core/Lib/logger.js';

let qstashClient = null;

export const getQStashClient = async () => {
    if (qstashClient) return qstashClient;

    const config = await getAppConfig();
    const token = config.qstash?.token || process.env.QSTASH_TOKEN;

    if (!token) {
        return null;
    }

    qstashClient = new Client({ token });
    return qstashClient;
};

// Use configured app URL for webhook callback
const getWebhookUrl = async () => {
    const config = await getAppConfig();
    const baseUrl = config.api_url || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) throw new Error("NEXT_PUBLIC_APP_URL / api_url is not set for production");
    return `${baseUrl.replace(/\/$/, '')}/api/webhooks/qstash`;
};

export const enqueueInvoice = async (email, bookingId, role) => {
    try {
        const client = await getQStashClient();
        if (!client) {
            // Local fallback when QStash token is not configured (e.g. local development)
            const { default: NotificationService } = await import('@/core/Services/General/NotificationService.js');
            setImmediate(async () => {
                try {
                    await NotificationService._processInvoiceDelivery(email, bookingId, role);
                } catch (err) {
                    getLogger().error({ err, email, bookingId, role }, '[QueueService] Direct invoice delivery error');
                }
            });
            return true;
        }

        const url = await getWebhookUrl();
        await client.publishJSON({
            url,
            body: {
                type: 'generate_invoice',
                payload: { email, bookingId, role }
            }
        });
        return true;
    } catch (error) {
        getLogger().error({ err: error, email, bookingId, role }, '[QueueService] enqueueInvoice failed');
        return false;
    }
};

export const enqueuePushNotification = async (token, notification, data = {}) => {
    try {
        const client = await getQStashClient();
        if (!client) {
            // Local fallback when QStash token is not configured (e.g. local development)
            const { PushNotificationService } = await import('@/core/Services/PushNotificationService.js');
            setImmediate(async () => {
                try {
                    await PushNotificationService.sendToDevice(token, notification, data);
                } catch (err) {
                    getLogger().error({ err, notification }, '[QueueService] Direct push notification error');
                }
            });
            return true;
        }

        const url = await getWebhookUrl();
        await client.publishJSON({
            url,
            body: {
                type: 'send_push_notification',
                payload: { token, notification, data }
            }
        });
        return true;
    } catch (error) {
        getLogger().error({ err: error, notification }, '[QueueService] enqueuePushNotification failed');
        return false;
    }
};

export const enqueueImageProcessing = async (imageUrl, folder, metadata = {}) => {
    try {
        const client = await getQStashClient();
        if (!client) {
            return true;
        }

        const url = await getWebhookUrl();
        await client.publishJSON({
            url,
            body: {
                type: 'process_image',
                payload: { imageUrl, folder, metadata }
            }
        });
        return true;
    } catch (error) {
        getLogger().error({ err: error, imageUrl, folder }, '[QueueService] enqueueImageProcessing failed');
        return false;
    }
};

export const enqueueOCRProcessing = async (vendorId, docType, imageBufferBase64) => {
    try {
        const client = await getQStashClient();
        if (!client) {
            // Local fallback when QStash token is not configured (e.g. local development)
            setImmediate(async () => {
                try {
                    const { default: OCRService } = await import('@/core/Services/Admin/OCRService.js');
                    const { default: Vendor } = await import('@/core/Models/Vendor.js');
                    const buffer = Buffer.from(imageBufferBase64, 'base64');
                    const ocrResult = await OCRService.processDocument(buffer);
                    await Vendor.findByIdAndUpdate(vendorId, {
                        $set: {
                            [`documents.${docType}.ocrData`]: {
                                identifiedId: ocrResult.identifiedId,
                                text: ocrResult.text
                            }
                        }
                    });
                } catch (err) {
                    getLogger().error({ err, vendorId, docType }, '[QueueService] Direct OCR processing error');
                }
            });
            return true;
        }

        const url = await getWebhookUrl();
        await client.publishJSON({
            url,
            body: {
                type: 'process_ocr',
                payload: { vendorId, docType, imageBufferBase64 }
            }
        });
        return true;
    } catch (error) {
        getLogger().error({ err: error, vendorId, docType }, '[QueueService] enqueueOCRProcessing failed');
        return false;
    }
};

export default {
    getQStashClient,
    enqueueInvoice,
    enqueuePushNotification,
    enqueueImageProcessing,
    enqueueOCRProcessing
};
