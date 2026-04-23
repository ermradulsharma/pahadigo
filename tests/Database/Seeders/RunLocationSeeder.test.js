import { jest } from '@jest/globals';

jest.unstable_mockModule('@/seeders/LocationSeeder.js', () => ({ seedLocations: jest.fn() }));
jest.unstable_mockModule('mongoose', () => ({
    default: { connect: jest.fn() }
}));

const { seedLocations } = await import('@/seeders/LocationSeeder.js');
const { default: mongoose } = await import('mongoose');
const { default: run } = await import('@/database/Seeders/RunLocationSeeder.js');

describe('Industry Standard: runLocationSeeder Entry Point', () => {
    let mockExit;

    beforeEach(() => {
        jest.clearAllMocks();
        mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
        process.env.MONGODB_URI = 'mongodb://test';
    });

    afterEach(() => {
        mockExit.mockRestore();
    });

    it('[Success] should connect and call seedLocations', async () => {
        seedLocations.mockResolvedValue(true);
        mongoose.connect.mockResolvedValue({});

        await run();

        expect(mongoose.connect).toHaveBeenCalled();
        expect(seedLocations).toHaveBeenCalled();
        expect(mockExit).toHaveBeenCalledWith(0);
    });
});
