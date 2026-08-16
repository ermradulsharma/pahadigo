import Booking from '@/core/Models/Booking.js';
import Dispute from '@/core/Models/Dispute.js';
import SearchLog from '@/core/Models/SearchLog.js';
import AuditLog from '@/core/Models/AuditLog.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { BOOKING_STATUS, PAYMENT_STATUS, STATUS } from '@/core/Constants/index.js';
import { getLogger } from '@/core/Lib/logger.js';
import CacheService from '@/core/Services/CacheService.js';
import InventoryService from '@/core/Services/Traveller/InventoryService.js';

class CronService {

    /**
     * Auto-completes bookings where the end date has passed.
     */
    static async autoCompleteBookings() {
        try {
            const bookingsToComplete = await Booking.find({
                status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.ONGOING] },
                endDate: { $lt: new Date() }
            }).select('_id').lean();

            if (bookingsToComplete.length === 0) return { matched: 0, modified: 0 };

            const bookingIds = bookingsToComplete.map(b => b._id);

            const result = await Booking.updateMany(
                { _id: { $in: bookingIds } },
                {
                    $set: { status: BOOKING_STATUS.COMPLETED },
                    $push: {
                        timeline: {
                            status: BOOKING_STATUS.COMPLETED,
                            remarks: 'Auto-completed by system cron job',
                            timestamp: new Date()
                        }
                    }
                }
            );

            // Fire & Forget Notifications
            Promise.allSettled(bookingIds.map(id => NotificationService.notifyBookingStatus(id, 'completed')));

            return { matched: result.matchedCount, modified: result.modifiedCount };
        } catch (error) {
            getLogger().error({ err: error }, '[CronService] autoCompleteBookings error');
            return { matched: 0, modified: 0, error: error.message };
        }
    }

    /**
     * Auto-expires pending bookings whose expiresAt time has passed.
     */
    static async autoExpireBookings() {
        try {
            const bookingsToExpire = await Booking.find({
                paymentStatus: { $in: [PAYMENT_STATUS.UNPAID, PAYMENT_STATUS.PENDING] },
                status: BOOKING_STATUS.PENDING,
                expiresAt: { $lt: new Date() }
            }).select('_id vendor item startDate endDate occupancy').lean();

            if (bookingsToExpire.length === 0) return { matched: 0, modified: 0 };

            const bookingIds = bookingsToExpire.map(b => b._id);

            const result = await Booking.updateMany(
                { _id: { $in: bookingIds } },
                {
                    $set: { status: BOOKING_STATUS.EXPIRED },
                    $push: {
                        timeline: {
                            status: BOOKING_STATUS.EXPIRED,
                            remarks: 'Auto-expired by system due to non-payment',
                            timestamp: new Date()
                        }
                    }
                }
            );

            // Auto-release inventory slots for expired bookings
            for (const b of bookingsToExpire) {
                if (b.vendor && b.item?.itemId && b.startDate && b.endDate) {
                    try {
                        await InventoryService.releaseSlotsRange(
                            b.vendor,
                            b.item.itemId,
                            b.item.itemType,
                            b.startDate,
                            b.endDate,
                            b.occupancy?.units || 1
                        );
                    } catch (invErr) {
                        getLogger().error({ err: invErr }, '[CronService] Failed to release slots for booking');
                    }
                }
            }

            // Fire & Forget Notifications
            Promise.allSettled(bookingIds.map(id => NotificationService.notifyBookingStatus(id, 'cancelled')));

            return { matched: result.matchedCount, modified: result.modifiedCount };
        } catch (error) {
            getLogger().error({ err: error }, '[CronService] autoExpireBookings error');
            return { matched: 0, modified: 0, error: error.message };
        }
    }

    /**
     * Auto-closes disputes that have been inactive for more than 7 days.
     */
    static async autoResolveDisputes() {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const inactiveDisputes = await Dispute.find({
                status: { $in: ['open', 'investigating'] },
                updatedAt: { $lt: sevenDaysAgo }
            }).select('_id').lean();

            if (inactiveDisputes.length === 0) return { matched: 0, modified: 0 };

            const disputeIds = inactiveDisputes.map(d => d._id);

            const result = await Dispute.updateMany(
                { _id: { $in: disputeIds } },
                {
                    $set: {
                        status: 'resolved_rejected',
                        adminNotes: 'Auto-resolved by system due to 7 days of inactivity',
                        resolvedAt: new Date()
                    }
                }
            );

            return { matched: result.matchedCount, modified: result.modifiedCount };
        } catch (error) {
            getLogger().error({ err: error }, '[CronService] autoResolveDisputes error');
            return { matched: 0, modified: 0, error: error.message };
        }
    }

    /**
     * Cleans up SearchLogs and AuditLogs based on retention policy.
     */
    static async cleanupLogs() {
        try {
            let retentionDays = 30;
            try {
                const { getAppConfig } = await import('@/core/Lib/appConfig.js');
                const config = await getAppConfig();
                if (config?.audit_log_retention_days) retentionDays = config.audit_log_retention_days;
            } catch (cfgErr) {
                // Fallback to default retention
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            const searchLogResult = await SearchLog.deleteMany({ createdAt: { $lt: cutoffDate } });
            const auditLogResult = await AuditLog.deleteMany({ createdAt: { $lt: cutoffDate } });

            return {
                searchLogsDeleted: searchLogResult?.deletedCount ?? 0,
                auditLogsDeleted: auditLogResult?.deletedCount ?? 0
            };
        } catch (error) {
            getLogger().error({ err: error }, '[CronService] cleanupLogs error');
            return { searchLogsDeleted: 0, auditLogsDeleted: 0, error: error.message };
        }
    }
}

export default CronService;
