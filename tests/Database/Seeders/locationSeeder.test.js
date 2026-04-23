import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Country.js', () => ({
    default: { findOneAndUpdate: jest.fn() }
}));

jest.unstable_mockModule('@/core/Models/State.js', () => ({
    default: { bulkWrite: jest.fn() }
}));

jest.unstable_mockModule('country-state-city', () => ({
    Country: { getAllCountries: jest.fn(() => [{ name: 'India', isoCode: 'IN', phonecode: '91', currency: 'INR' }]) },
    State: { getStatesOfCountry: jest.fn(() => [{ name: 'Uttarakhand', isoCode: 'UK' }]) }
}));

const { default: seedLocations } = await import('@/database/Seeders/locationSeeder.js');
const { default: CountryModel } = await import('@/core/Models/Country.js');
const { default: StateModel } = await import('@/core/Models/State.js');

describe('Industry Standard: locationSeeder Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should seed countries and states', async () => {
        CountryModel.findOneAndUpdate.mockResolvedValue({ _id: 'c1' });
        StateModel.bulkWrite.mockResolvedValue({});

        const result = await seedLocations();

        expect(result).toBe(true);
        expect(CountryModel.findOneAndUpdate).toHaveBeenCalled();
        expect(StateModel.bulkWrite).toHaveBeenCalled();
    });

    it('[Failure] should return false on top-level error', async () => {
        const { Country } = await import('country-state-city');
        Country.getAllCountries.mockImplementation(() => { throw new Error('Crashed'); });

        const result = await seedLocations();
        expect(result).toBe(false);
    });
});
