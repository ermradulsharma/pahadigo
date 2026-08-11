import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/AuditLog.js', () => ({
    default: {
        create: jest.fn(),
        countDocuments: jest.fn(),
        find: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/requestUtils.js', () => ({
    getRequestMetadata: jest.fn(() => ({ ipAddress: '1.1.1.1', userAgent: 'test' }))
}));

jest.unstable_mockModule('@/core/Helpers/security.js', () => ({
    redactSensitiveData: jest.fn(data => data)
}));

const { default: AuditService } = await import('@/core/Services/Admin/AuditService.js');
const { default: AuditLog } = await import('@/core/Models/AuditLog.js');
const { getRequestMetadata } = await import('@/core/Helpers/requestUtils.js');

describe('AuditService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('logAction', () => {
        it('should create an audit log and set req._auditLogged', async () => {
            const req = {};
            await AuditService.logAction('u1', 'CREATE', 'USER', 't1', { name: 'Test' }, req);
            
            expect(req._auditLogged).toBe(true);
            expect(getRequestMetadata).toHaveBeenCalledWith(req);
            expect(AuditLog.create).toHaveBeenCalledWith({
                userId: 'u1',
                action: 'CREATE',
                target: 'USER',
                targetId: 't1',
                details: { name: 'Test' },
                ipAddress: '1.1.1.1',
                userAgent: 'test'
            });
        });

        it('should swallow errors gracefully', async () => {
            AuditLog.create.mockRejectedValue(new Error('DB failure'));
            await expect(AuditService.logAction('u1', 'action', 'target', 't1')).resolves.not.toThrow();
        });
    });

    describe('getAuditLogs', () => {
        it('should return logs with pagination', async () => {
            AuditLog.countDocuments.mockResolvedValue(2);
            AuditLog.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockReturnValue({
                                lean: jest.fn().mockResolvedValue([{ _id: 'l1' }, { _id: 'l2' }])
                            })
                        })
                    })
                })
            });

            const result = await AuditService.getAuditLogs({ userId: 'u1' }, 1, 10);
            expect(result.total).toBe(2);
            expect(result.logs.length).toBe(2);
            expect(result.totalPages).toBe(1);
            expect(AuditLog.find).toHaveBeenCalledWith({ userId: 'u1' });
        });

        it('should handle adminId filter and date ranges', async () => {
            AuditLog.countDocuments.mockResolvedValue(1);
            AuditLog.find.mockReturnValue({ populate: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ skip: jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) }) }) }) });

            await AuditService.getAuditLogs({ adminId: 'a1', action: 'del', target: 'user', startDate: '2023-01-01', endDate: '2023-12-31' });
            
            expect(AuditLog.find).toHaveBeenCalledWith({
                userId: 'a1',
                action: 'DEL',
                target: 'USER',
                createdAt: { $gte: new Date('2023-01-01'), $lte: new Date('2023-12-31') }
            });
        });
    });
});
