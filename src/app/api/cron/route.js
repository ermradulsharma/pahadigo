import { createNextRouter } from '@/core/Helpers/nextApiWrapper.js';
import CronController from '@/core/Http/Controllers/General/CronController.js';

const cronRoutes = [
  { method: 'GET', path: '/cron', handler: (req) => CronController.handleCron(req) }
];

const handler = createNextRouter(cronRoutes);
export { handler as GET };
