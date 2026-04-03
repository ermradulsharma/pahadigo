import Dispute from '../../src/core/Models/Dispute.js';
import mongoose from 'mongoose';

describe('Dispute Model', () => {
    const bookingId = new mongoose.Types.ObjectId();
    const raisedBy = new mongoose.Types.ObjectId();
    const vendorId = new mongoose.Types.ObjectId();

    beforeEach(async () => {
        await Dispute.deleteMany({});
    });

    it('should create a dispute with defaults', async () => {
        const dispute = await Dispute.create({
            bookingId,
            raisedBy,
            vendorId,
            reason: 'vendor_no_show',
            description: 'The vendor did not show up.'
        });

        expect(dispute.status).toBe('open');
        expect(dispute.reason).toBe('vendor_no_show');
    });

    it('should fail if reason is invalid', async () => {
        const dispute = new Dispute({ 
            bookingId, raisedBy, vendorId, 
            reason: 'invalid_reason', description: 'Desc' 
        });
        await expect(dispute.save()).rejects.toThrow();
    });
});
