import CronService from '@/core/Services/CronService.js';
import Booking from '@/core/Models/Booking.js';
import Dispute from '@/core/Models/Dispute.js';
import SearchLog from '@/core/Models/SearchLog.js';
import AuditLog from '@/core/Models/AuditLog.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import { jest } from '@jest/globals';

describe('CronService', () => {
    beforeEach(() => {
        jest.restoreAllMocks();
    });

    describe('autoCompleteBookings', () => {
        it('should auto-complete bookings successfully', async () => {
            const mockBookings = [{ _id: 'b1' }, { _id: 'b2' }];
            jest.spyOn(Booking, 'find').mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockBookings)
                })
            });
            jest.spyOn(Booking, 'updateMany').mockResolvedValue({ matchedCount: 2, modifiedCount: 2 });
            jest.spyOn(NotificationService, 'notifyBookingStatus').mockResolvedValue();

            const result = await CronService.autoCompleteBookings();

            expect(Booking.find).toHaveBeenCalled();
            expect(Booking.updateMany).toHaveBeenCalled();
            expect(NotificationService.notifyBookingStatus).toHaveBeenCalledTimes(2);
            expect(result).toEqual({ matched: 2, modified: 2 });
        });

        it('should return 0 when no bookings found', async () => {
            jest.spyOn(Booking, 'find').mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([])
                })
            });
            jest.spyOn(Booking, 'updateMany').mockResolvedValue();

            const result = await CronService.autoCompleteBookings();
            expect(Booking.updateMany).not.toHaveBeenCalled();
            expect(result).toEqual({ matched: 0, modified: 0 });
        });
    });

    describe('autoExpireBookings', () => {
        it('should auto-expire bookings successfully', async () => {
            const mockBookings = [{ _id: 'b3' }];
            jest.spyOn(Booking, 'find').mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue(mockBookings)
                })
            });
            jest.spyOn(Booking, 'updateMany').mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

            const result = await CronService.autoExpireBookings();
            expect(result).toEqual({ matched: 1, modified: 1 });
        });
    });

    describe('autoResolveDisputes', () => {
        it('should resolve old disputes', async () => {
            jest.spyOn(Dispute, 'find').mockReturnValue({
                select: jest.fn().mockReturnValue({
                    lean: jest.fn().mockResolvedValue([{ _id: 'd1' }])
                })
            });
            jest.spyOn(Dispute, 'updateMany').mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

            const result = await CronService.autoResolveDisputes();
            expect(result).toEqual({ matched: 1, modified: 1 });
        });
    });

    describe('cleanupLogs', () => {
        it('should clean up old logs', async () => {
            jest.spyOn(SearchLog, 'deleteMany').mockResolvedValue({ deletedCount: 5 });
            jest.spyOn(AuditLog, 'deleteMany').mockResolvedValue({ deletedCount: 10 });

            const result = await CronService.cleanupLogs();
            expect(result).toEqual({ searchLogsDeleted: 5, auditLogsDeleted: 10 });
        });
    });
});
