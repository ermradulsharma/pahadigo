import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Policy.js', () => ({
    default: { bulkWrite: jest.fn() }
}));

const { default: seedPolicies } = await import('@/database/Seeders/policySeeder.js');
const { default: Policy } = await import('@/core/Models/Policy.js');

describe('Industry Standard: policySeeder Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should seed default policies using bulkWrite', async () => {
        Policy.bulkWrite.mockResolvedValue({ matchedCount: 1, upsertedCount: 5 });

        const result = await seedPolicies();

        expect(Policy.bulkWrite).toHaveBeenCalled();
        expect(result.upserted).toBe(5);
    });

    it('[Failure] should throw error on bulkWrite failure', async () => {
        Policy.bulkWrite.mockRejectedValue(new Error('Seed Error'));
        await expect(seedPolicies()).rejects.toThrow('Seed Error');
    });
});
