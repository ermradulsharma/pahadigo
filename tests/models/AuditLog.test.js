import mongoose from 'mongoose';
import AuditLog from '../../src/core/Models/AuditLog.js';

describe('AuditLogModel Test Suite', () => {
    it('should require adminId, action, and target', async () => {
        const log = new AuditLog({});
        let error;
        try { await log.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.adminId).toBeDefined();
        expect(error.errors.action).toBeDefined();
        expect(error.errors.target).toBeDefined();
    });

    it('should uppercase and trim action and target strings', async () => {
        const log = new AuditLog({
            adminId: new mongoose.Types.ObjectId(),
            action: '   delete  ',
            target: 'vendor_profile   '
        });

        const saved = await log.save();
        expect(saved.action).toBe('DELETE');
        expect(saved.target).toBe('VENDOR_PROFILE');
    });

    it('should accept flexible mixed types for details', async () => {
        const log = new AuditLog({
            adminId: new mongoose.Types.ObjectId(),
            action: 'UPDATE',
            target: 'SETTINGS',
            details: { old: 'A', new: 'B', count: 1 }
        });

        const saved = await log.save();
        expect(saved.details.new).toBe('B');
        expect(saved.details.count).toBe(1);
    });
});
