import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import QStashWebhookController from '@/core/Http/Controllers/General/QStashWebhookController.js';

/**
 * QStash Webhook Receiver (Serverless Background Job Processor)
 * Delegates job execution to QStashWebhookController.
 */
async function handler(req) {
    return await QStashWebhookController.processJob(req);
}

const hasKeys = Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY);

export const POST = hasKeys
    ? verifySignatureAppRouter(handler, {
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY
    })
    : async function (req) {
        if (process.env.NODE_ENV === 'production') {
            console.warn('[QStash Webhook] QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY are missing.');
        }
        return handler(req);
    };

