import { jest } from '@jest/globals';

const createMockQuery = (val) => ({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    _resolvedValue: val,
    then: jest.fn(function(resolve) { resolve(this._resolvedValue); })
});

jest.unstable_mockModule('@/models/Country.js', () => ({
    default: {
        find: jest.fn(),
        findById: jest.fn(),
        countDocuments: jest.fn()
    }
}));

jest.unstable_mockModule('@/models/State.js', () => ({
    default: {
        find: jest.fn(),
        countDocuments: jest.fn()
    }
}));

const { default: LocationService } = await import('@/services/General/LocationService.js');
const { default: Country } = await import('@/models/Country.js');
const { default: State } = await import('@/models/State.js');

describe('Industry Standard: LocationService Business Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Countries] should fetch paginated active countries', async () => {
        const mockCountries = [{ name: 'India' }, { name: 'Nepal' }];
        Country.countDocuments.mockResolvedValue(100);
        Country.find.mockReturnValue(createMockQuery(mockCountries));

        const result = await LocationService.getCountries(1, 10);

        expect(result.countries).toHaveLength(2);
        expect(result.pagination.total).toBe(100);
        expect(Country.find).toHaveBeenCalledWith({ status: 'active' });
    });

    it('[Countries] should handle "all" limit parameter for broad retrieval', async () => {
        Country.countDocuments.mockResolvedValue(10);
        Country.find.mockReturnValue(createMockQuery([]));

        const result = await LocationService.getCountries(1, 'all');

        expect(result.pagination.limit).toBe(500);
    });

    it('[States] should fetch paginated active states by country', async () => {
        const mockStates = [{ name: 'Uttarakhand' }];
        State.countDocuments.mockResolvedValue(5);
        State.find.mockReturnValue(createMockQuery(mockStates));

        const result = await LocationService.getStatesByCountry('country123', 1);

        expect(result.states).toHaveLength(1);
        expect(State.find).toHaveBeenCalledWith({ country: 'country123', status: 'active' });
    });
});
