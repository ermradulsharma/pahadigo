import PolicyController from '../../src/core/Http/Controllers/PolicyController.js';
import Policy from '../../src/core/Models/Policy.js';
import mongoose from 'mongoose';

describe('Policy API Controller Test Suite', () => {

    it('should deny unauthorized policies fetch', async () => {
        const req = { user: null }; // No user
        const res = await PolicyController.getPolicies(req);
        expect(res.status).toBe(403);
    });

    it('should fetch policies for a specific target via public route', async () => {
        await Policy.create({
            target: 'vendor',
            type: 'privacy_policy',
            content: 'Do not share data'
        });

        const req = {};
        const params = { target: 'vendor' };
        const res = await PolicyController.getPoliciesByTarget(req, { params });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.data.policies).toBeDefined();
    });

    it('should fetch specific policy type publicly', async () => {
        await Policy.create({
            target: 'traveller',
            type: 'cancellation_policy',
            content: 'Cancel anytime'
        });

        const req = {};
        const params = { target: 'traveller', type: 'cancellation-policy' }; // Controller maps this to cancellation_policy
        const res = await PolicyController.getPolicyByType(req, { params });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.data.policy.content).toBe('Cancel anytime');
    });

    it('should allow admin to update policy', async () => {
        const req = {
            user: { role: 'admin', id: new mongoose.Types.ObjectId().toString() },
            jsonBody: { target: 'vendor', type: 'privacy_policy', content: 'Updated rule' }
        };
        const params = { target: 'vendor', type: 'privacy-policy' };

        const res = await PolicyController.updatePolicy(req, { params });
        expect(res.status).toBe(200);
    });
});
