import ChatController from '@/core/Http/Controllers/General/ChatController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/chat' }, [
        { method: 'GET', path: '/stream', handler: wrap(() => ChatController, 'getStream') },
        { method: 'POST', path: '/conversation/:bookingId', schema: schemas.chatMessage, handler: wrap(() => ChatController, 'createConversation') },
        { method: 'GET', path: '/conversations', handler: wrap(() => ChatController, 'getConversations') },
        { method: 'GET', path: '/conversations/:id/messages', handler: wrap(() => ChatController, 'getMessages') },
        { method: 'POST', path: '/conversations/:id/messages', schema: schemas.chatMessage, handler: wrap(() => ChatController, 'sendMessage') },
        { method: 'PATCH', path: '/conversations/:id/read', schema: schemas.settingsUpdate, handler: wrap(() => ChatController, 'markAsRead') },
    ]),
];
