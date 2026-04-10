import EmergencyAlert from '@/models/EmergencyAlert';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: EmergencyAlert Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(EmergencyAlert).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = EmergencyAlert.schema || EmergencyAlert;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
