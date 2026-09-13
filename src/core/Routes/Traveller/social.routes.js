import SOSController from '@/core/Controllers/General/SOSController.js';
import ChatController from '@/core/Http/Controllers/General/ChatController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

export default [
    // Chat / Conversations Hub
    ...Router.group({ prefix: '/chat' }, [
        { method: 'GET', path: '/stream', handler: wrap(() => ChatController, 'getStream') },
        { method: 'POST', path: '/conversation/:bookingId', handler: wrap(() => ChatController, 'createConversation') },
        { method: 'GET', path: '/conversations', handler: wrap(() => ChatController, 'getConversations') },
        { method: 'GET', path: '/conversations/:id/messages', handler: wrap(() => ChatController, 'getMessages') },
        { method: 'POST', path: '/conversations/:id/messages', handler: wrap(() => ChatController, 'sendMessage') },
        { method: 'PATCH', path: '/conversations/:id/read', handler: wrap(() => ChatController, 'markAsRead') },
    ]),
];
