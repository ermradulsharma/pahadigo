import mongoose from 'mongoose';
import SearchLog from '../../../src/core/Models/SearchLog.js';

describe('SearchLogModel Test Suite', () => {
    it('should require a query', async () => {
        const log = new SearchLog({});
        let error;
        try { await log.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.query).toBeDefined();
    });

    it('should trim and lowercase the query string', async () => {
        const log = new SearchLog({ query: '   TrekkINg in HIMALAYAS   ' });
        const saved = await log.save();

        expect(saved.query).toBe('trekking in himalayas');
        expect(saved.count).toBe(1); // default
        expect(saved.resultsCount).toBe(0); // default
    });
});
