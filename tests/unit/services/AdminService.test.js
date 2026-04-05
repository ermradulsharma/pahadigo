import AdminService from '../../../src/core/Services/AdminService.js';
import User from '../../../src/core/Models/User.js';
import Vendor from '../../../src/core/Models/Vendor.js';
import Booking from '../../../src/core/Models/Booking.js';
import AuditLog from '../../../src/core/Models/AuditLog.js';
import { cleanDatabase, generateId } from '../../helpers/testUtils.js';

describe('AdminService Test Suite', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    describe('getDashboardStats', () => {
        it('should return aggregated counts', async () => {
            await User.create({ name: 'U1', role: 'traveller', status: 'active', identifier: 'u1@test.com' });
            await Vendor.create({ user: generateId(), businessName: 'V1', isApproved: true });
            await Booking.create({ 
                user: generateId(), 
                vendor: generateId(), 
                package: generateId(), 
                totalPrice: 1000, 
                paymentStatus: 'paid',
                travelStartTime: new Date(),
                travelEndTime: new Date()
            });

            const stats = await AdminService.getDashboardStats();
            expect(stats.users).toBe(1);
            expect(stats.totalVendors).toBe(1);
            expect(stats.revenue).toBe(1000);
        });
    });

    describe('logAction', () => {
        it('should create an audit log entry', async () => {
            const adminId = generateId();
            const targetId = generateId();
            const req = { 
                headers: { get: () => '127.0.0.1' },
                url: 'http://localhost' 
            };

            await AdminService.logAction(adminId, 'UPDATE', 'USER', targetId, { field: 'name' }, req);
            
            const log = await AuditLog.findOne({ userId: adminId });
            expect(log).toBeDefined();
            expect(log.action).toBe('UPDATE');
            expect(log.target).toBe('USER');
            expect(log.targetId).toBe(targetId.toString());
        });
    });
});
