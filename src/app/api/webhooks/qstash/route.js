import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import QStashWebhookController from '@/core/Http/Controllers/General/QStashWebhookController.js';

/**
 * QStash Webhook Receiver (Serverless Background Job Processor)
 * Delegates job execution to QStashWebhookController.
 */
async function handler(req) {
    return await QStashWebhookController.processJob(req);
}

const isDev = process.env.NODE_ENV !== 'production';
const hasKeys = Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY);

const config = {
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || '',
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || ''
};

export const POST = (isDev && !hasKeys) ? handler : verifySignatureAppRouter(handler, config);
