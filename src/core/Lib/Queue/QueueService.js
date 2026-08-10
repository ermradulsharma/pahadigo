import { Client } from '@upstash/qstash';
import { getAppConfig } from '../appConfig.js';

let qstashClient = null;

export const getQStashClient = async () => {
    if (qstashClient) return qstashClient;

    const config = await getAppConfig();
    const token = process.env.QSTASH_TOKEN || config.qstash?.token;

    if (!token) {
        console.warn('[QueueService] QSTASH_TOKEN is missing. Background jobs will not be processed securely.');
    }

    qstashClient = new Client({ token: token });
    return qstashClient;
};

// Use an environment variable for the webhook URL
const getWebhookUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set for production");
    return `${baseUrl}/api/webhooks/qstash`;
};

export const enqueueInvoice = async (email, bookingId, role) => {
    try {
        const client = await getQStashClient();
        await client.publishJSON({
            url: getWebhookUrl(),
            body: {
                type: 'generate_invoice',
                payload: { email, bookingId, role }
            }
        });
        // console.log(`[QueueService] QStash: Published generate_invoice for Booking: ${bookingId}`);
        return true;
    } catch (error) {
        // console.error('[QueueService] Failed to publish invoice to QStash:', error);
        return false;
    }
};

export const enqueuePushNotification = async (token, notification, data = {}) => {
    try {
        const client = await getQStashClient();
        await client.publishJSON({
            url: getWebhookUrl(),
            body: {
                type: 'send_push_notification',
                payload: { token, notification, data }
            }
        });
        // console.log(`[QueueService] QStash: Published send_push_notification for token: ${token.substring(0, 15)}...`);
        return true;
    } catch (error) {
        // console.error('[QueueService] Failed to publish push notification to QStash:', error);
        return false;
    }
};

export const enqueueImageProcessing = async (imageUrl, folder, metadata = {}) => {
    try {
        const client = await getQStashClient();
        await client.publishJSON({
            url: getWebhookUrl(),
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
