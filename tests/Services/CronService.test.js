import { jest } from '@jest/globals';

const mockBookingFind = jest.fn();
const mockBookingUpdateMany = jest.fn();
const mockDisputeFind = jest.fn();
const mockDisputeUpdateMany = jest.fn();
const mockSearchLogDeleteMany = jest.fn();
const mockAuditLogDeleteMany = jest.fn();

jest.unstable_mockModule('@/core/Models/Booking.js', () => ({
    __esModule: true,
    default: {
        find: mockBookingFind,
        updateMany: mockBookingUpdateMany
    }
}));

jest.unstable_mockModule('@/core/Models/Dispute.js', () => ({
    __esModule: true,
    default: {
        find: mockDisputeFind,
        updateMany: mockDisputeUpdateMany
    }
}));

jest.unstable_mockModule('@/core/Models/SearchLog.js', () => ({
    __esModule: true,
    default: {
        deleteMany: mockSearchLogDeleteMany
    }
}));

jest.unstable_mockModule('@/core/Models/AuditLog.js', () => ({
    __esModule: true,
    default: {
        deleteMany: mockAuditLogDeleteMany
    }
}));

jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({
    __esModule: true,
    default: {
        notifyBookingStatus: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/Traveller/InventoryService.js', () => ({
    __esModule: true,
    default: {
        releaseSlotsRange: jest.fn().mockResolvedValue(true)
    }
}));

jest.unstable_mockModule('@/core/Lib/logger.js', () => ({
    getLogger: jest.fn().mockReturnValue({
        error: jest.fn(),
        info: jest.fn()
    })
}));

const { default: CronService } = await import('@/core/Services/CronService.js');

describe('CronService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('autoCompleteBookings', () => {
        it('should update status to completed for past bookings', async () => {
            mockBookingFind.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([{ _id: 'b1' }])
            });
            mockBookingUpdateMany.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

            const result = await CronService.autoCompleteBookings();

            expect(result.matched).toBe(1);
            expect(result.modified).toBe(1);
            expect(mockBookingUpdateMany).toHaveBeenCalledWith(
                { _id: { $in: ['b1'] } },
                expect.objectContaining({ $set: expect.objectContaining({ status: 'completed' }) })
            );
        });

        it('should return 0 matched when no bookings are past end date', async () => {
            mockBookingFind.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([])
            });

            const result = await CronService.autoCompleteBookings();
            expect(result).toEqual({ matched: 0, modified: 0 });
        });
    });

    describe('autoExpireBookings', () => {
        it('should expire unpaid bookings and release inventory slots', async () => {
            mockBookingFind.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([
                    { _id: 'b1', vendor: 'v1', item: { itemId: 'i1', itemType: 'hotel' }, startDate: '2026-08-01', endDate: '2026-08-05', occupancy: { units: 2 } }
                ])
            });
            mockBookingUpdateMany.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

            const result = await CronService.autoExpireBookings();

            expect(result.matched).toBe(1);
            expect(mockBookingUpdateMany).toHaveBeenCalledWith(
                { _id: { $in: ['b1'] } },
                expect.objectContaining({ $set: expect.objectContaining({ status: 'expired' }) })
            );
        });
    });

    describe('autoResolveDisputes', () => {
        it('should auto-reject inactive disputes after 7 days', async () => {
            mockDisputeFind.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                lean: jest.fn().mockResolvedValue([{ _id: 'd1' }])
            });
            mockDisputeUpdateMany.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });

            const result = await CronService.autoResolveDisputes();

            expect(result.matched).toBe(1);
            expect(mockDisputeUpdateMany).toHaveBeenCalledWith(
                { _id: { $in: ['d1'] } },
                expect.objectContaining({ $set: expect.objectContaining({ status: 'resolved_rejected' }) })
            );
        });
    });

    describe('cleanupLogs', () => {
        it('should clean up old search and audit logs', async () => {
            mockSearchLogDeleteMany.mockResolvedValue({ deletedCount: 50 });
            mockAuditLogDeleteMany.mockResolvedValue({ deletedCount: 10 });

            const result = await CronService.cleanupLogs();

            expect(result.searchLogsDeleted).toBe(50);
            expect(result.auditLogsDeleted).toBe(10);
        });
    });
});
