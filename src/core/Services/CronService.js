import Booking from '@/core/Models/Booking.js';
import Dispute from '@/core/Models/Dispute.js';
import SearchLog from '@/core/Models/SearchLog.js';
import AuditLog from '@/core/Models/AuditLog.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { BOOKING_STATUS, PAYMENT_STATUS } from '@/core/Constants/index.js';

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
            console.error('[CronService] autoCompleteBookings error:', error);
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
            }).select('_id').lean();

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

            // Fire & Forget Notifications
            Promise.allSettled(bookingIds.map(id => NotificationService.notifyBookingStatus(id, 'cancelled')));

            return { matched: result.matchedCount, modified: result.modifiedCount };
        } catch (error) {
            console.error('[CronService] autoExpireBookings error:', error);
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
            console.error('[CronService] autoResolveDisputes error:', error);
            return { matched: 0, modified: 0, error: error.message };
        }
    }

    /**
     * Cleans up SearchLogs and AuditLogs older than 30 days.
     */
    static async cleanupLogs() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const searchLogResult = await SearchLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
            const auditLogResult = await AuditLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });

            return {
                searchLogsDeleted: searchLogResult.deletedCount,
                auditLogsDeleted: auditLogResult.deletedCount
            };
        } catch (error) {
            console.error('[CronService] cleanupLogs error:', error);
            return { searchLogsDeleted: 0, auditLogsDeleted: 0, error: error.message };
        }
    }
}

export default CronService;
