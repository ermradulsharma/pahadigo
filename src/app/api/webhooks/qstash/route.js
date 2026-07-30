import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { PushNotificationService } from '@/core/Services/PushNotificationService.js';
import { NextResponse } from 'next/server';

/**
 * QStash Webhook Receiver (Serverless Background Job Processor)
 * Handles incoming jobs published to QStash by the QueueService.
 */
async function handler(req) {
    try {
        const body = await req.json();
        
        if (!body || !body.type || !body.payload) {
            return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
        }

        const { type, payload } = body;
        console.log(`[QStash Webhook] Received job type: ${type}`);

        if (type === 'generate_invoice') {
            const { email, bookingId, role } = payload;
            const success = await NotificationService._processInvoiceDelivery(email, bookingId, role);
            if (!success) {
                return NextResponse.json({ error: 'Failed to deliver invoice' }, { status: 500 });
            }
            return NextResponse.json({ success: true, delivered: true, bookingId });
            
        } else if (type === 'send_push_notification') {
            const { token, notification, data } = payload;
            const result = await PushNotificationService.sendToDevice(token, notification, data);
            
            if (!result.success) {
                return NextResponse.json({ error: result.error || 'Unknown Push Error' }, { status: 500 });
            }
            return NextResponse.json({ success: true, delivered: true, messageId: result.messageId });
            
        } else {
            console.warn(`[QStash Webhook] Unknown job type: ${type}`);
            return NextResponse.json({ error: 'Unknown job type' }, { status: 400 });
        }

    } catch (error) {
        console.error('[QStash Webhook] Processing error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// In local development or during builds without keys, use fallback dummy keys to prevent crashes
const config = {
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || 'dummy_current_key',
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || 'dummy_next_key'
};

const isDev = process.env.NODE_ENV !== 'production';
const hasKeys = process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY;

export const POST = (isDev && !hasKeys) ? handler : verifySignatureAppRouter(handler, config);
