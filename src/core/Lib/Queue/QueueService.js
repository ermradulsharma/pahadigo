import { Client } from '@upstash/qstash';
import { getAppConfig } from '../appConfig.js';

let qstashClient = null;

export const getQStashClient = async () => {
    if (qstashClient) return qstashClient;

    const config = await getAppConfig();
    const token = config.qstash?.token || process.env.QSTASH_TOKEN;

    if (!token) {
        console.warn('[QueueService] QSTASH_TOKEN is missing. Background jobs will not be processed securely.');
    }

    qstashClient = new Client({ token: token || '' });
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
        return false;
    }
};

export const enqueuePushNotification = async (token, notification, data = {}) => {
    try {
        const client = await getQStashClient();
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
        return false;
    }
};

export const enqueueImageProcessing = async (imageUrl, folder, metadata = {}) => {
    try {
        const client = await getQStashClient();
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
        return false;
    }
};

export default {
    getQStashClient,
    enqueueInvoice,
    enqueuePushNotification,
    enqueueImageProcessing
};
