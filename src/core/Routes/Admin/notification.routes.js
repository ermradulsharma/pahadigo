import NotificationController from '@/core/Controllers/General/NotificationController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

export default [
    ...Router.group({ prefix: '/notifications' }, [
        { method: 'GET', path: '/', handler: wrap(() => NotificationController, 'getNotifications') },
        { method: 'GET', path: '/stream', handler: wrap(() => NotificationController, 'getStream') },
        { method: 'GET', path: '/unread-count', handler: wrap(() => NotificationController, 'getUnreadCount') },
        { method: 'PATCH', path: '/read-all', handler: wrap(() => NotificationController, 'markAllAsRead') },
        { method: 'DELETE', path: '/clear-all', handler: wrap(() => NotificationController, 'clearAll') },
        { method: 'PATCH', path: '/:id/read', handler: wrap(() => NotificationController, 'markAsRead') },
        { method: 'DELETE', path: '/:id', handler: wrap(() => NotificationController, 'dismiss') },
    ]),
];
