import { jest } from '@jest/globals';
import mongoose from 'mongoose';

const mockAggregate = jest.fn();

jest.unstable_mockModule('@/core/Models/Notification.js', () => ({
    default: {
        aggregate: mockAggregate
    }
}));

const { getNotifications } = await import('@/core/Helpers/Notifications/notifications.js');

describe('Helpers: Notifications/notifications', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw unauthorized error when userId is missing or invalid ObjectId', async () => {
        await expect(getNotifications({})).rejects.toThrow('Valid user ID is required');
        await expect(getNotifications({ userId: 'invalid-id' })).rejects.toThrow('Valid user ID is required');
    });

    it('should aggregate notifications and return paginated result', async () => {
        const validUserId = new mongoose.Types.ObjectId().toString();
        const mockNotificationList = [
            { id: 'notif_1', title: 'Booking Approved', message: 'Your trip is confirmed', isRead: false },
            { id: 'notif_2', title: 'Payment Success', message: 'Invoice ready', isRead: true }
        ];

        mockAggregate.mockResolvedValueOnce([
            {
                data: mockNotificationList,
                totalCount: [{ count: 25 }]
            }
        ]);

        const result = await getNotifications({
            userId: validUserId,
            page: 2,
            limit: 10
        });

        expect(mockAggregate).toHaveBeenCalled();
        expect(result.notifications).toHaveLength(2);
        expect(result.pagination).toEqual({
            total: 25,
            page: 2,
            limit: 10,
            totalPages: 3
        });
    });

    it('should handle zero results gracefully with empty data array', async () => {
        const validUserId = new mongoose.Types.ObjectId().toString();

        mockAggregate.mockResolvedValueOnce([
            {
                data: [],
                totalCount: []
            }
        ]);

        const result = await getNotifications({ userId: validUserId });
        expect(result.notifications).toEqual([]);
        expect(result.pagination).toEqual({
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0
        });
    });
});

