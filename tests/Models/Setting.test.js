import Setting from '@/models/Setting';
import { cleanDatabase } from '../Helpers/testUtils.js';

describe('Industry Standard: Setting Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should be correctly defined', async () => {
        expect(Setting).toBeDefined();
    });

    it('[Integrity] should have a valid physical or logical schema', async () => {
        const schema = Setting.schema || Setting;
        expect(schema.paths || schema.obj).toBeDefined();
    });
});
