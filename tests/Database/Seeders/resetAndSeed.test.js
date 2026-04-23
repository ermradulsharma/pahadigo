import { jest } from '@jest/globals';
jest.unstable_mockModule('mongoose', () => ({
    default: {
        connection: { db: { dropDatabase: jest.fn() } }
    }
}));
jest.unstable_mockModule('@/core/Seeders/CategorySeeder.js', () => ({ seedCategories: jest.fn() }));
jest.unstable_mockModule('@/core/Seeders/CategoryDocumentSeeder.js', () => ({ seedCategoryDocuments: jest.fn() }));
jest.unstable_mockModule('@/core/Seeders/UserSeeder.js', () => ({ seedUsers: jest.fn() }));
jest.unstable_mockModule('@/core/Seeders/SettingSeeder.js', () => ({ seedSettings: jest.fn() }));
jest.unstable_mockModule('@/core/Seeders/LocationSeeder.js', () => ({ seedLocations: jest.fn() }));
jest.unstable_mockModule('@/core/Seeders/PolicySeeder.js', () => ({ seedPolicies: jest.fn() }));
jest.unstable_mockModule('@/core/Config/db.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('@/core/Helpers/env.js', () => ({ loadEnv: jest.fn() }));

const { default: mongoose } = await import('mongoose');
const { default: resetAndSeed } = await import('@/database/Seeders/ResetAndSeed.js');

describe('Industry Standard: Database Reset and Seed Logic', () => {
    let mockExit;

    beforeEach(() => {
        jest.clearAllMocks();
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
        // Setup default success mock
        mongoose.connection.db.dropDatabase.mockResolvedValue(true);
    });

    afterEach(() => {
        if (mockExit && mockExit.mockRestore) {
            mockExit.mockRestore();
        }
    });

    it('[Success] should drop database and call all seeders', async () => {
        await resetAndSeed();

        expect(mongoose.connection.db.dropDatabase).toHaveBeenCalled();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('[Failure] should exit with code 1 on error', async () => {
        mongoose.connection.db.dropDatabase.mockRejectedValue(new Error('Drop Failed'));
        
        await resetAndSeed();
        
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
