import mongoose from 'mongoose';
import Policy from '../../src/core/Models/Policy.js';

describe('PolicyModel Test Suite', () => {
    beforeEach(async () => {
        await Policy.syncIndexes();
    });

    it('should require target, type, and content', async () => {
        const policy = new Policy({});
        let error;
        try { await policy.validate(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.errors.target).toBeDefined();
        expect(error.errors.type).toBeDefined();
        expect(error.errors.content).toBeDefined();
    });

    it('should strictly enforce uniqueness of target and type', async () => {
        const p1 = new Policy({
            target: 'vendor',
            type: 'privacy_policy',
            content: 'Policy 1'
        });
        await p1.save();

        const p2 = new Policy({
            target: 'vendor',
            type: 'privacy_policy',
            content: 'Policy 2'
        });

        let error;
        try { await p2.save(); } catch (e) { error = e; }

        expect(error).toBeDefined();
        expect(error.code).toBe(11000); // duplicate key
    });
});
