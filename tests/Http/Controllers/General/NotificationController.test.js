import { jest } from '@jest/globals';

const mockNotificationService = {
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    dismissNotification: jest.fn(),
    clearAllNotifications: jest.fn()
};

const mockNotificationEmitter = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
};

jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({
    default: mockNotificationService,
    notificationEmitter: mockNotificationEmitter
}));

const { default: NotificationController } = await import('@/core/Http/Controllers/General/NotificationController.js');

describe('Industry Standard: NotificationController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[getNotifications]', () => {
        it('[Success] should fetch paginated notifications for authenticated user', async () => {
            const req = {
                user: { id: 'user123' },
                query: { page: '1', limit: '10' }
            };

            const mockResult = {
                notifications: [{ _id: 'n1', title: 'Hello', isRead: false }],
                pagination: { page: 1, limit: 10, total: 1, totalPages: 1, unreadCount: 1 }
            };

            mockNotificationService.getUserNotifications.mockResolvedValue(mockResult);

            const response = await NotificationController.getNotifications(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockResult.notifications);
            expect(data.pagination.total).toBe(1);
            expect(data.pagination.page).toBe(1);
            expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith('user123', {
                page: '1',
                limit: '10',
                filter: 'all'
            });
        });

        it('[Failure] should return 401 if user is unauthenticated', async () => {
            const req = { user: null };
            const response = await NotificationController.getNotifications(req);
            expect(response.status).toBe(401);
        });
    });

    describe('[getUnreadCount]', () => {
        it('[Success] should return unread count for user', async () => {
            const req = { user: { id: 'user123' } };
            mockNotificationService.getUnreadCount.mockResolvedValue(5);

            const response = await NotificationController.getUnreadCount(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.data.unreadCount).toBe(5);
            expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith('user123');
        });
    });

    describe('[markAsRead]', () => {
        it('[Success] should mark single notification as read', async () => {
            const req = { user: { id: 'user123' } };
            const mockResult = {
                notification: { _id: 'n1', isRead: true },
                unreadCount: 0
            };
            mockNotificationService.markAsRead.mockResolvedValue(mockResult);

            const response = await NotificationController.markAsRead(req, { id: 'n1' });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('n1', 'user123');
            expect(data.data.unreadCount).toBe(0);
        });

        it('[Failure] should return 404 if notification not found', async () => {
            const req = { user: { id: 'user123' } };
            mockNotificationService.markAsRead.mockResolvedValue(null);

            const response = await NotificationController.markAsRead(req, { id: 'invalid_id' });
            expect(response.status).toBe(404);
        });
    });

    describe('[markAllAsRead]', () => {
        it('[Success] should mark all user notifications as read', async () => {
            const req = { user: { id: 'user123' } };
            mockNotificationService.markAllAsRead.mockResolvedValue(true);

            const response = await NotificationController.markAllAsRead(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith('user123');
            expect(data.data.unreadCount).toBe(0);
        });
    });

    describe('[dismiss]', () => {
        it('[Success] should soft-delete single notification', async () => {
            const req = { user: { id: 'user123' } };
            mockNotificationService.dismissNotification.mockResolvedValue({ unreadCount: 0 });

            const response = await NotificationController.dismiss(req, { id: 'n1' });
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(mockNotificationService.dismissNotification).toHaveBeenCalledWith('n1', 'user123');
        });

        it('[Failure] should return 404 if notification not found on dismiss', async () => {
            const req = { user: { id: 'user123' } };
            mockNotificationService.dismissNotification.mockResolvedValue(null);

            const response = await NotificationController.dismiss(req, { id: 'not_found' });
            expect(response.status).toBe(404);
        });
    });

    describe('[clearAll]', () => {
        it('[Success] should soft-delete all notifications', async () => {
            const req = { user: { id: 'user123' } };
            mockNotificationService.clearAllNotifications.mockResolvedValue(true);

            const response = await NotificationController.clearAll(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(mockNotificationService.clearAllNotifications).toHaveBeenCalledWith('user123');
            expect(data.data.unreadCount).toBe(0);
        });
    });

    describe('[getStream]', () => {
        it('[Success] should return SSE stream Response for authenticated user', async () => {
            const req = {
                user: { id: 'user123' },
                signal: { addEventListener: jest.fn() }
            };
            const response = await NotificationController.getStream(req);
            expect(response.status).toBe(200);
            expect(response.headers.get('Content-Type')).toBe('text/event-stream');
        });

        it('[Failure] should return 401 if user is unauthenticated', async () => {
            const req = { user: null };
            const response = await NotificationController.getStream(req);
            expect(response.status).toBe(401);
        });
    });
});
