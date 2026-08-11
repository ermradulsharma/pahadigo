import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Country.js', () => ({
    default: {
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
        findById: jest.fn(),
        find: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Models/State.js', () => ({
    default: {
        create: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        findByIdAndDelete: jest.fn(),
        find: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Services/CacheService.js', () => ({
    default: {
        delete: jest.fn(),
        deletePattern: jest.fn(),
        get: jest.fn(),
        set: jest.fn()
    }
}));

jest.unstable_mockModule('@/core/Helpers/AppError.js', () => ({
    default: class AppError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    }
}));

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    RESPONSE_MESSAGES: {}
}));

const { default: LocationService } = await import('@/core/Services/Admin/LocationService.js');
const { default: Country } = await import('@/core/Models/Country.js');
const { default: State } = await import('@/core/Models/State.js');
const { default: CacheService } = await import('@/core/Services/CacheService.js');
const { default: AppError } = await import('@/core/Helpers/AppError.js');

describe('Admin LocationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createCountry', () => {
        it('should create country and invalidate cache', async () => {
            const mockData = { name: 'India' };
            Country.create.mockResolvedValue({ _id: 'c1', ...mockData });
            
            const result = await LocationService.createCountry(mockData);
            
            expect(result._id).toBe('c1');
            expect(Country.create).toHaveBeenCalledWith(mockData);
            expect(CacheService.delete).toHaveBeenCalledWith('admin:locations:countries');
        });
    });

    describe('updateCountry', () => {
        it('should update country and invalidate cache', async () => {
            const mockData = { name: 'USA' };
            Country.findByIdAndUpdate.mockResolvedValue({ _id: 'c1', ...mockData });
            
            const result = await LocationService.updateCountry('c1', mockData);
            
            expect(result._id).toBe('c1');
            expect(Country.findByIdAndUpdate).toHaveBeenCalledWith('c1', mockData, { new: true });
            expect(CacheService.delete).toHaveBeenCalledWith('admin:locations:countries');
        });

        it('should throw AppError if country not found', async () => {
            Country.findByIdAndUpdate.mockResolvedValue(null);
            await expect(LocationService.updateCountry('c1', {})).rejects.toThrow('Country not found');
        });
    });

    describe('deleteCountry', () => {
        it('should delete country and invalidate cache', async () => {
            Country.findByIdAndDelete.mockResolvedValue({ _id: 'c1' });
            
            await LocationService.deleteCountry('c1');
            
            expect(Country.findByIdAndDelete).toHaveBeenCalledWith('c1');
            expect(CacheService.delete).toHaveBeenCalledWith('admin:locations:countries');
        });
    });

    describe('createState', () => {
        it('should create state and invalidate cache', async () => {
            const mockData = { name: 'Delhi' };
            State.create.mockResolvedValue({ _id: 's1', ...mockData });
            
            const result = await LocationService.createState(mockData);
            
            expect(result._id).toBe('s1');
            expect(CacheService.deletePattern).toHaveBeenCalledWith('admin:locations:states:*');
        });
    });

    describe('updateState', () => {
        it('should update state and invalidate cache', async () => {
            const mockData = { name: 'Goa' };
            State.findByIdAndUpdate.mockResolvedValue({ _id: 's1', ...mockData });
            
            const result = await LocationService.updateState('s1', mockData);
            
            expect(result._id).toBe('s1');
            expect(CacheService.deletePattern).toHaveBeenCalledWith('admin:locations:states:*');
        });

        it('should throw AppError if state not found', async () => {
            State.findByIdAndUpdate.mockResolvedValue(null);
            await expect(LocationService.updateState('s1', {})).rejects.toThrow('State not found');
        });
    });

    describe('deleteState', () => {
        it('should delete state and invalidate cache', async () => {
            State.findByIdAndDelete.mockResolvedValue({ _id: 's1' });
            await LocationService.deleteState('s1');
            expect(CacheService.deletePattern).toHaveBeenCalledWith('admin:locations:states:*');
        });
    });

    describe('getCountryById', () => {
        it('should return from cache if available', async () => {
            CacheService.get.mockResolvedValue({ _id: 'c1', name: 'Cached Country' });
            
            const result = await LocationService.getCountryById('c1');
            
            expect(result.name).toBe('Cached Country');
            expect(Country.findById).not.toHaveBeenCalled();
        });

        it('should fetch from DB, set cache and return if not in cache', async () => {
            CacheService.get.mockResolvedValue(null);
            Country.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'c1', name: 'DB Country' }) });
            
            const result = await LocationService.getCountryById('c1');
            
            expect(result.name).toBe('DB Country');
            expect(CacheService.set).toHaveBeenCalledWith('admin:locations:country:c1', result, 300);
        });

        it('should throw AppError if not found in DB', async () => {
            CacheService.get.mockResolvedValue(null);
            Country.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
            await expect(LocationService.getCountryById('c1')).rejects.toThrow('Country not found');
        });
    });

    describe('listCountries', () => {
        it('should return from cache if available', async () => {
            CacheService.get.mockResolvedValue([{ name: 'Cached' }]);
            const result = await LocationService.listCountries();
            expect(result[0].name).toBe('Cached');
            expect(Country.find).not.toHaveBeenCalled();
        });

        it('should fetch from DB, sort, set cache and return if not in cache', async () => {
            CacheService.get.mockResolvedValue(null);
            const mockDbResult = [{ name: 'A' }, { name: 'B' }];
            Country.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockDbResult) }) });
            
            const result = await LocationService.listCountries();
            
            expect(result).toEqual(mockDbResult);
            expect(CacheService.set).toHaveBeenCalledWith('admin:locations:countries', mockDbResult, 300);
        });
    });

    describe('listStates', () => {
        it('should return from cache if available', async () => {
            CacheService.get.mockResolvedValue([{ name: 'Cached State' }]);
            const result = await LocationService.listStates('c1');
            expect(result[0].name).toBe('Cached State');
        });

        it('should fetch from DB with country filter, set cache and return', async () => {
            CacheService.get.mockResolvedValue(null);
            const mockDbResult = [{ name: 'State A' }];
            State.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(mockDbResult) }) });
            
            const result = await LocationService.listStates('c1');
            
            expect(State.find).toHaveBeenCalledWith({ country: 'c1' });
            expect(CacheService.set).toHaveBeenCalledWith('admin:locations:states:c1', mockDbResult, 300);
        });

        it('should fetch all states if countryId is not provided', async () => {
            CacheService.get.mockResolvedValue(null);
            State.find.mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
            
            await LocationService.listStates();
            
            expect(State.find).toHaveBeenCalledWith({});
            expect(CacheService.set).toHaveBeenCalledWith('admin:locations:states:all', [], 300);
        });
    });
});
