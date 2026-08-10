import { jest } from '@jest/globals';

const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([])
};

jest.unstable_mockModule('@/core/Models/Country.js', () => ({
    default: {
        create: jest.fn(),
        find: jest.fn(() => mockQuery)
    }
}));

jest.unstable_mockModule('@/core/Models/State.js', () => ({
    default: {
        create: jest.fn(),
        find: jest.fn(() => mockQuery)
    }
}));

const { default: LocationService } = await import('@/services/Admin/LocationService.js');
const { default: Country } = await import('@/core/Models/Country.js');

describe('Industry Standard: LocationService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[createCountry]', () => {
        it('[Success] should create new country', async () => {
            const data = { name: 'India', code: 'IN' };
            Country.create.mockResolvedValue(data);

            const result = await LocationService.createCountry(data);

            expect(Country.create).toHaveBeenCalledWith(data);
            expect(result.name).toBe('India');
        });
    });

    describe('[listCountries]', () => {
        it('[Success] should list all countries sorted', async () => {
            await LocationService.listCountries();
            expect(Country.find).toHaveBeenCalled();
        });
    });
});
