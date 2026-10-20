import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import NotificationService, { notificationEmitter } from '@/core/Services/General/NotificationService.js';
import { verifyToken } from '@/core/Helpers/jwt.js';

/**
 * NotificationController - Unified HTTP presentation controller.
 * Adheres strictly to SOLID Single Responsibility Principle by delegating
 * all domain logic and database operations to NotificationService.
 */
class NotificationController extends Controller {

    // GET /notifications (Paginated list with filter)
    async getNotifications(req) {
        try {
            const userId = req.user?.id || req.user?._id;
            if (!userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

            const { page = 1, limit = 15, filter = 'all' } = req.query || {};
            const result = await NotificationService.getUserNotifications(userId, { page, limit, filter });

            return this.paginatedSuccess(
                HTTP_STATUS.OK,
                RESPONSE_MESSAGES.SUCCESS.FETCHED,
                result.notifications,
                result.pagination
            );
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error?.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /notifications/unread-count (For header bell badge)
    async getUnreadCount(req) {
        try {
            const userId = req.user?.id || req.user?._id;
            if (!userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

            const unreadCount = await NotificationService.getUnreadCount(userId);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { unreadCount });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error?.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /notifications/:id/read (Mark single notification as read)
    async markAsRead(req, params) {
        try {
            const userId = req.user?.id || req.user?._id;
            if (!userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

            const id = params?.id || req.params?.id;
            if (!id) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

            const result = await NotificationService.markAsRead(id, userId);
            if (!result) return this.error(HTTP_STATUS.NOT_FOUND, 'Notification not found');

            return this.success(HTTP_STATUS.OK, 'Notification marked as read', result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error?.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // PATCH /notifications/read-all (Mark all notifications as read)
    async markAllAsRead(req) {
        try {
            const userId = req.user?.id || req.user?._id;
            if (!userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

            await NotificationService.markAllAsRead(userId);
            return this.success(HTTP_STATUS.OK, 'All notifications marked as read', { unreadCount: 0 });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error?.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // DELETE /notifications/:id (Soft dismiss single notification)
    async dismiss(req, params) {
        try {
            const userId = req.user?.id || req.user?._id;
            if (!userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

            const id = params?.id || req.params?.id;
            if (!id) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

            const result = await NotificationService.dismissNotification(id, userId);
            if (!result) return this.error(HTTP_STATUS.NOT_FOUND, 'Notification not found');

            return this.success(HTTP_STATUS.OK, 'Notification dismissed', result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error?.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // DELETE /notifications/clear-all (Soft dismiss all notifications)
    async clearAll(req) {
        try {
            const userId = req.user?.id || req.user?._id;
            if (!userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

            await NotificationService.clearAllNotifications(userId);
            return this.success(HTTP_STATUS.OK, 'All notifications cleared', { unreadCount: 0 });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error?.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /notifications/stream (Persistent SSE Real-time push stream)
    async getStream(req) {
        try {
            let userId = req.user?.id || req.user?._id;
            let userRole = req.user?.role;

            if (!userId && req.url) {
                try {
                    const url = new URL(req.url, 'http://localhost');
                    const queryToken = url.searchParams.get('token') || url.searchParams.get('access_token');
                    if (queryToken) {
                        const decoded = await verifyToken(queryToken);
                        if (decoded?.id) {
                            userId = decoded.id;
                            userRole = decoded.role;
                        }
                    }
                } catch {}
            }

            if (!userId) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.TOKEN_REQUIRED);

            const userIdStr = userId.toString();
            let onNotification;
            let heartbeat;

            const stream = new ReadableStream({
                start(controller) {
                    onNotification = (data) => {
                        try {
                            if (data.recipientId === userIdStr || userRole === 'admin') {
                                const payload = `data: ${JSON.stringify(data.notification)}\n\n`;
                                controller.enqueue(new TextEncoder().encode(payload));
                            }
                        } catch {}
                    };

                    notificationEmitter.on('notification', onNotification);

                    // Keep-alive heartbeat every 25 seconds
                    heartbeat = setInterval(() => {
                        try {
                            controller.enqueue(new TextEncoder().encode(': heartbeat\n\n'));
                        } catch {}
                    }, 25000);

                    req.signal?.addEventListener('abort', () => {
                        if (onNotification) notificationEmitter.off('notification', onNotification);
                        if (heartbeat) clearInterval(heartbeat);
                    });
                },
                cancel() {
                    if (onNotification) notificationEmitter.off('notification', onNotification);
                    if (heartbeat) clearInterval(heartbeat);
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'
                }
            });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error?.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const notificationController = new NotificationController();
export default notificationController;
