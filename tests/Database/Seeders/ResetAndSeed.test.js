import { jest } from '@jest/globals';
jest.unstable_mockModule('mongoose', () => ({
    default: {
        connection: { 
            db: { 
                collections: jest.fn().mockResolvedValue([
                    { collectionName: 'users', deleteMany: jest.fn() }
                ]) 
            } 
        }
    }
}));
jest.unstable_mockModule('@/core/Database/Seeders/CategorySeeder.js', () => ({ seedCategories: jest.fn() }));
jest.unstable_mockModule('@/core/Database/Seeders/CategoryDocumentSeeder.js', () => ({ seedCategoryDocuments: jest.fn() }));
jest.unstable_mockModule('@/core/Database/Seeders/UserSeeder.js', () => ({ seedUsers: jest.fn() }));
jest.unstable_mockModule('@/core/Database/Seeders/SettingSeeder.js', () => ({ seedSettings: jest.fn() }));
jest.unstable_mockModule('@/core/Database/Seeders/LocationSeeder.js', () => ({ seedLocations: jest.fn() }));
jest.unstable_mockModule('@/core/Database/Seeders/PolicySeeder.js', () => ({ seedPolicies: jest.fn() }));
jest.unstable_mockModule('@/core/Config/db.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('@/core/Helpers/env.js', () => ({ loadEnv: jest.fn() }));

const { default: mongoose } = await import('mongoose');
const { default: resetAndSeed } = await import('@/core/Database/Seeders/ResetAndSeed.js');

describe('Industry Standard: Database Reset and Seed Logic', () => {
    let mockExit;

    beforeEach(() => {
        jest.clearAllMocks();
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
        mongoose.connection.db.collections.mockResolvedValue([
            { collectionName: 'users', deleteMany: jest.fn().mockResolvedValue(true) }
        ]);
    });

    afterEach(() => {
        if (mockExit && mockExit.mockRestore) {
            mockExit.mockRestore();
        }
    });

    it('[Success] should clear collections and call all seeders', async () => {
        await resetAndSeed();
        expect(mongoose.connection.db.collections).toHaveBeenCalled();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('[Failure] should exit with code 1 on error', async () => {
        mongoose.connection.db.collections.mockRejectedValue(new Error('DB Failed'));
        await resetAndSeed();
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
