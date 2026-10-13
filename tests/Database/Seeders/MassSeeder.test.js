import { jest } from '@jest/globals';

const mockDeleteManyUser = jest.fn();
const mockInsertManyUser = jest.fn();
const mockDeleteManyVendor = jest.fn();
const mockInsertManyVendor = jest.fn();
const mockConnectDB = jest.fn();
const mockLoadEnv = jest.fn();

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: {
        deleteMany: mockDeleteManyUser,
        insertMany: mockInsertManyUser
    }
}));

jest.unstable_mockModule('@/core/Models/Vendor.js', () => ({
    default: {
        deleteMany: mockDeleteManyVendor,
        insertMany: mockInsertManyVendor
    }
}));

jest.unstable_mockModule('@/core/Config/db.js', () => ({
    default: mockConnectDB
}));

jest.unstable_mockModule('@/core/Helpers/env.js', () => ({
    loadEnv: mockLoadEnv
}));

const { seedMass } = await import('@/core/Database/Seeders/MassSeeder.js');

describe('Industry Standard: Database Mass Seeder', () => {
    let mockExit;
    const originalArgv = process.argv;
    const originalEnv = process.env.NODE_ENV;
    const originalAppEnv = process.env.APP_ENV;

    beforeEach(() => {
        jest.clearAllMocks();
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
        process.env.NODE_ENV = 'test';
        process.env.APP_ENV = 'test';
        process.argv = ['node', 'MassSeeder.js', '--users=2', '--vendors=2', '--batchSize=2'];

        mockDeleteManyUser.mockResolvedValue({});
        mockDeleteManyVendor.mockResolvedValue({});
        mockInsertManyUser.mockImplementation(async (batch) => {
            return batch.map((u, i) => ({ ...u, _id: `generated_id_${i}` }));
        });
        mockInsertManyVendor.mockResolvedValue([]);
    });

    afterEach(() => {
        process.argv = originalArgv;
        process.env.NODE_ENV = originalEnv;
        process.env.APP_ENV = originalAppEnv;
        if (mockExit && mockExit.mockRestore) {
            mockExit.mockRestore();
        }
    });

    it('[Production Safety Guard] should abort and exit with code 1 in production', async () => {
        process.env.NODE_ENV = 'production';
        await seedMass();
        expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('[Success] should parse parameters, clear collections, and insert mock users and vendors', async () => {
        await seedMass();

        expect(mockLoadEnv).toHaveBeenCalled();
        expect(mockConnectDB).toHaveBeenCalled();
        expect(mockDeleteManyUser).toHaveBeenCalled();
        expect(mockDeleteManyVendor).toHaveBeenCalled();
        expect(mockInsertManyUser).toHaveBeenCalled();
        expect(mockInsertManyVendor).toHaveBeenCalled();
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('[Failure] should catch unhandled rejection and exit with code 1', async () => {
        mockDeleteManyUser.mockRejectedValue(new Error('Connection lost'));
        await seedMass();
        expect(mockExit).toHaveBeenCalledWith(1);
    });
});
