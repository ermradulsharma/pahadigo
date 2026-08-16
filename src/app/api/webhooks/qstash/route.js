import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import QStashWebhookController from '@/core/Http/Controllers/General/QStashWebhookController.js';

/**
 * QStash Webhook Receiver (Serverless Background Job Processor)
 * Delegates job execution to QStashWebhookController.
 */
async function handler(req) {
    return await QStashWebhookController.processJob(req);
}

// In local development or during builds without keys, use fallback dummy keys to prevent crashes
const config = {
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || 'dummy_current_key',
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || 'dummy_next_key'
};

const isDev = process.env.NODE_ENV !== 'production';
const hasKeys = process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

export const POST = (isDev && !hasKeys) ? handler : verifySignatureAppRouter(handler, config);
