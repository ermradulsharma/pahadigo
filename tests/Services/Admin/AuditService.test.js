import { jest } from '@jest/globals';

// Create a reusable mock for the chainable query
const mockQuery = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis()
};

jest.unstable_mockModule('@/models/AuditLog.js', () => ({
    default: {
        create: jest.fn(),
        countDocuments: jest.fn(),
        find: jest.fn(() => mockQuery)
    }
}));

const { default: AuditService } = await import('@/services/Admin/AuditService.js');
const { default: AuditLog } = await import('@/models/AuditLog.js');

describe('Industry Standard: AuditService Logging', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the mock chain
        mockQuery.populate.mockReturnThis();
        mockQuery.sort.mockReturnThis();
        mockQuery.skip.mockReturnThis();
        mockQuery.limit.mockReturnThis();
    });

    describe('[logAction]', () => {
        it('[Success] should create an audit log entry', async () => {
            const req = {
                headers: { get: () => '127.0.0.1' },
                socket: { remoteAddress: '127.0.0.1' }
            };
            await AuditService.logAction('u1', 'CREATE', 'VENDOR', 'v1', { name: 'Test' }, req);
            
            expect(AuditLog.create).toHaveBeenCalledWith(expect.objectContaining({
                userId: 'u1',
                action: 'CREATE',
                target: 'VENDOR'
            }));
            expect(req._auditLogged).toBe(true);
        });
    });

    describe('[getAuditLogs]', () => {
        it('[Success] should apply date range filters correctly', async () => {
            AuditLog.countDocuments.mockResolvedValue(10);
            mockQuery.limit.mockResolvedValue([]);

            const filter = { startDate: '2024-01-01', endDate: '2024-01-31' };
            await AuditService.getAuditLogs(filter);

            expect(AuditLog.countDocuments).toHaveBeenCalledWith(expect.objectContaining({
                createdAt: {
                    $gte: expect.any(Date),
                    $lte: expect.any(Date)
                }
            }));
        });
    });
});
