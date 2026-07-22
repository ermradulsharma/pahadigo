import { Queue } from 'bullmq';
import { getAppConfig } from '@/core/Lib/appConfig.js';

let notificationQueue = null;

export const getNotificationQueue = async () => {
    if (notificationQueue) return notificationQueue;

    const config = await getAppConfig();
    const redisUrl = config.redis.standard_url || config.redis.upstash_tcp_url || 'redis://localhost:6379';

    notificationQueue = new Queue('NotificationQueue', {
        connection: {
            url: redisUrl
        },
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        }
    });

    return notificationQueue;
};

export const enqueueInvoice = async (email, bookingId, role) => {
    try {
        const queue = await getNotificationQueue();
        await queue.add('generate_invoice', { email, bookingId, role });
        console.log(`[QueueService] Enqueued generate_invoice for Booking: ${bookingId}`);
        return true;
    } catch (error) {
        console.error('[QueueService] Failed to enqueue invoice:', error);
        return false;
    }
};

export default {
    getNotificationQueue,
    enqueueInvoice
};
