import Notification from '@/models/Notification.js';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Notification Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Notification).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Notification.schema || Notification;
        expect(schema.paths || schema.obj).toBeDefined();
        expect(schema.paths.recipient).toBeDefined();
        expect(schema.paths.title).toBeDefined();
        expect(schema.paths.message).toBeDefined();
        expect(schema.paths.isRead).toBeDefined();
        expect(schema.paths.isDeleted).toBeDefined();
        expect(schema.paths.expiresAt).toBeDefined();
        expect(schema.paths['deliveryStatus.inApp']).toBeDefined();
    });

    it('[Methods] should have markAsRead and dismiss instance methods', () => {
        expect(typeof Notification.schema.methods.markAsRead).toBe('function');
        expect(typeof Notification.schema.methods.dismiss).toBe('function');
    });

    it('[Statics] should have unread and batch helper static methods', () => {
        expect(typeof Notification.getUnreadCount).toBe('function');
        expect(typeof Notification.markAllAsRead).toBe('function');
        expect(typeof Notification.clearAll).toBe('function');
    });
});
