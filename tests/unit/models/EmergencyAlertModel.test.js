import EmergencyAlert from '../../../src/core/Models/EmergencyAlert.js';
import mongoose from 'mongoose';

describe('EmergencyAlert Model', () => {
    const userId = new mongoose.Types.ObjectId();

    beforeEach(async () => {
        await EmergencyAlert.deleteMany({});
    });

    it('should create an active emergency alert', async () => {
        const alert = await EmergencyAlert.create({
            userId,
            location: { latitude: 30, longitude: 78, address: 'Remote Peak' }
        });

        expect(alert.status).toBe('active');
        expect(alert.location.latitude).toBe(30);
    });

    it('should track notified contacts', async () => {
        const alert = await EmergencyAlert.create({
            userId,
            notifiedContacts: [{ name: 'Dad', phone: '123', status: 'sent' }]
        });

        expect(alert.notifiedContacts).toHaveLength(1);
        expect(alert.notifiedContacts[0].name).toBe('Dad');
    });
});
