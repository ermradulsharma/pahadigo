import { Worker } from 'bullmq';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import NotificationService from '@/core/Services/General/NotificationService.js';

let notificationWorker = null;

export const initNotificationWorker = async () => {
    if (notificationWorker) return notificationWorker;

    const config = await getAppConfig();
    const redisUrl = config.redis.standard_url || config.redis.upstash_tcp_url || 'redis://localhost:6379';

    notificationWorker = new Worker('NotificationQueue', async (job) => {
        console.log(`[NotificationWorker] Processing job ${job.id} of type ${job.name}...`);
        
        if (job.name === 'generate_invoice') {
            const { email, bookingId, role } = job.data;
            const success = await NotificationService._processInvoiceDelivery(email, bookingId, role);
            if (!success) {
                throw new Error(`Failed to deliver invoice for Booking: ${bookingId}`);
            }
            return { delivered: true, bookingId };
        }
    }, {
        connection: {
            url: redisUrl
        },
        concurrency: 2
    });

    notificationWorker.on('completed', (job) => {
        console.log(`[NotificationWorker] Job ${job.id} has completed!`);
    });

    notificationWorker.on('failed', (job, err) => {
        console.error(`[NotificationWorker] Job ${job.id} has failed with error: ${err.message}`);
    });

    console.log('[NotificationWorker] Started listening to NotificationQueue.');
    return notificationWorker;
};
