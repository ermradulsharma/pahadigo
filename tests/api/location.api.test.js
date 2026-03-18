import { jest } from '@jest/globals';

let mockParseBody = jest.fn();

jest.unstable_mockModule('../../src/core/Helpers/parseBody.js', () => ({
    parseBody: mockParseBody
}));

const LocationController = (await import('../../src/core/Http/Controllers/LocationController.js')).default;
const Country = (await import('../../src/core/Models/Country.js')).default;
const State = (await import('../../src/core/Models/State.js')).default;
const { HTTP_STATUS } = await import('../../src/core/Constants/index.js');

describe('LocationController API Test Suite', () => {

    afterEach(() => {
        jest.restoreAllMocks();
        mockParseBody.mockClear();
    });

    describe('getCountries', () => {
        it('should fetch countries with default pagination', async () => {
            jest.spyOn(Country, 'countDocuments').mockResolvedValue(2);
            const mockFind = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ name: 'India' }, { name: 'USA' }])
            };
            jest.spyOn(Country, 'find').mockReturnValue(mockFind);

            const req = { url: 'http://localhost/api/countries' };
            const res = await LocationController.getCountries(req);
            
            expect(res.status).toBe(HTTP_STATUS.OK);
        });

        it('should handle limit "all"', async () => {
            jest.spyOn(Country, 'countDocuments').mockResolvedValue(5);
            const mockFind = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([])
            };
            jest.spyOn(Country, 'find').mockReturnValue(mockFind);

            const req = { url: 'http://localhost/api/countries?limit=all' };
            await LocationController.getCountries(req);
            expect(mockFind.limit).toHaveBeenCalledWith(500);
        });

        it('should cap specific explicit limit max to 500', async () => {
            jest.spyOn(Country, 'countDocuments').mockResolvedValue(5);
            const mockFind = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([])
            };
            jest.spyOn(Country, 'find').mockReturnValue(mockFind);

            const req = { url: 'http://localhost/api/countries?limit=999' };
            await LocationController.getCountries(req);
            expect(mockFind.limit).toHaveBeenCalledWith(500);
        });

        it('should handle page skipping', async () => {
            jest.spyOn(Country, 'countDocuments').mockResolvedValue(50);
            const mockFind = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([])
            };
            jest.spyOn(Country, 'find').mockReturnValue(mockFind);

            const req = { url: 'http://localhost/api/countries?page=3&limit=10' };
            await LocationController.getCountries(req);
            expect(mockFind.skip).toHaveBeenCalledWith(20);
        });

        it('should return 500 on internal error', async () => {
            jest.spyOn(Country, 'countDocuments').mockRejectedValue(new Error('DB Error'));
            
            const req = { url: 'http://localhost/api/countries' };
            const res = await LocationController.getCountries(req);
            expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('getCountryById', () => {
        it('should fetch an existing country', async () => {
            jest.spyOn(Country, 'findById').mockResolvedValue({ name: 'India' });
            const res = await LocationController.getCountryById({}, { params: { id: 'test' } });
            expect(res.status).toBe(HTTP_STATUS.OK);
        });

        it('should return 404 for missing country', async () => {
            jest.spyOn(Country, 'findById').mockResolvedValue(null);
            const res = await LocationController.getCountryById({}, { params: { id: 'test' } });
            expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
        });

        it('should return 500 on internal error', async () => {
            jest.spyOn(Country, 'findById').mockRejectedValue(new Error('fail'));
            const res = await LocationController.getCountryById({}, { params: { id: 'test' } });
            expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('createCountry', () => {
        it('should create country and return 201', async () => {
            mockParseBody.mockResolvedValue({ name: 'India', isoCode: 'IN' });
            jest.spyOn(Country, 'create').mockResolvedValue({ name: 'India' });

            const res = await LocationController.createCountry({});
            expect(res.status).toBe(HTTP_STATUS.CREATED);
        });

        it('should return 400 on error', async () => {
            mockParseBody.mockRejectedValue(new Error('bad req'));

            const res = await LocationController.createCountry({});
            expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('getStates', () => {
        it('should filter states by country via URL search params', async () => {
            const mockFind = {
                sort: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue([{ name: 'Delhi' }])
            };
            jest.spyOn(State, 'find').mockReturnValue(mockFind);

            const req = { url: 'http://localhost/api/states?country=ind_id' };
            const res = await LocationController.getStates(req);
            expect(res.status).toBe(HTTP_STATUS.OK);
            expect(State.find).toHaveBeenCalledWith({ status: 'active', country: 'ind_id' });
        });

        it('should return 500 on internal error', async () => {
            jest.spyOn(State, 'find').mockImplementation(() => { throw new Error('DB Error') });
            const req = { url: 'http://localhost/api/states' };
            const res = await LocationController.getStates(req);
            expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('getStatesByCountry (Parameterized)', () => {
        it('should fetch state paginated for a country ID properly handling page and literal limits', async () => {
             jest.spyOn(State, 'countDocuments').mockResolvedValue(30);
             const mockFind = {
                 sort: jest.fn().mockReturnThis(),
                 skip: jest.fn().mockReturnThis(),
                 limit: jest.fn().mockResolvedValue([{ name: 'Goa' }])
             };
             jest.spyOn(State, 'find').mockReturnValue(mockFind);

             const req = { url: 'http://localhost/api/states?limit=all' };
             const res = await LocationController.getStatesByCountry(req, { params: { id: 'country123' } });

             expect(res.status).toBe(HTTP_STATUS.OK);
             expect(mockFind.limit).toHaveBeenCalledWith(500);
        });

        it('should return paginated capped limits explicitly', async () => {
             jest.spyOn(State, 'countDocuments').mockResolvedValue(30);
             const mockFind = {
                 sort: jest.fn().mockReturnThis(),
                 skip: jest.fn().mockReturnThis(),
                 limit: jest.fn().mockResolvedValue([])
             };
             jest.spyOn(State, 'find').mockReturnValue(mockFind);

             const req = { url: 'http://localhost/api/states?limit=15&page=2' };
             await LocationController.getStatesByCountry(req, { params: { id: 'country123' } });

             expect(mockFind.skip).toHaveBeenCalledWith(15);
             expect(mockFind.limit).toHaveBeenCalledWith(15);
        });

        it('should return 500 on internal error', async () => {
            jest.spyOn(State, 'countDocuments').mockRejectedValue(new Error('fail'));
            const req = { url: 'http://localhost/api/states' };
            const res = await LocationController.getStatesByCountry(req, { params: { id: 'c' } });
            expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        });
    });

    describe('createState', () => {
        it('should create state and return 201', async () => {
            mockParseBody.mockResolvedValue({ name: 'UK', country: 'ind_id' });
            jest.spyOn(State, 'create').mockResolvedValue({ name: 'UK' });

            const res = await LocationController.createState({});
            expect(res.status).toBe(HTTP_STATUS.CREATED);
        });

        it('should return 400 on error', async () => {
            mockParseBody.mockRejectedValue(new Error('err'));
            const res = await LocationController.createState({});
            expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
        });
    });

    describe('seedLocations', () => {
        it('should return 200 seed info', async () => {
            const res = await LocationController.seedLocations();
            expect(res.status).toBe(HTTP_STATUS.OK);
        });
    });
});
