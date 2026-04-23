import SearchLog from '@/models/SearchLog.js';
import { cleanDatabase, generateId } from '../Helpers/testUtils.js';

describe('Industry Standard: SearchLog Data Structure', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    it('[Success] should create a valid search log entry', async () => {
        const logData = {
            query: 'trekking in manali',
            resultsCount: 5,
            user: generateId()
        };
        const log = await SearchLog.create(logData);
        expect(log.query).toBe('trekking in manali');
        expect(log.count).toBe(1);
    });

    it('[Failure] should fail if query is missing', async () => {
        const log = new SearchLog({});
        let err;
        try {
            await log.validate();
        } catch (e) {
            err = e;
        }
        expect(err.errors.query).toBeDefined();
    });
});
