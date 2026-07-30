import LocationController from '@/controllers/General/LocationController';
import LocationService from '@/core/Services/General/LocationService.js';
import { createMockReq } from '../../../Helpers/testUtils.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { jest } from '@jest/globals';

// Mock the LocationService
jest.unstable_mockModule('@/core/Services/General/LocationService.js', () => ({
    default: {
        getCountries: jest.fn(),
        getCountryById: jest.fn(),
        getStatesByCountry: jest.fn()
    }
}));

// Re-import the controller to ensure it uses the mocked service
const { default: MockedLocationController } = await import('@/controllers/General/LocationController');

describe('Industry Standard: LocationController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getCountries', () => {
        it('[Success] should fetch countries successfully', async () => {
            const mockCountries = { countries: [{ id: '1', name: 'India' }], total: 1 };
            LocationService.getCountries = jest.fn().mockResolvedValue(mockCountries);

            const req = createMockReq({ url: 'http://localhost/locations/countries?page=1' });
            const response = await MockedLocationController.getCountries(req);
            const body = await response.json();

            expect(LocationService.getCountries).toHaveBeenCalledWith(1, null);
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.LOCATION.FETCHED);
            expect(body.data).toEqual(mockCountries);
        });

        it('[Failure] should handle internal server errors gracefully', async () => {
            LocationService.getCountries = jest.fn().mockRejectedValue(new Error('Database error'));

            const req = createMockReq({ url: 'http://localhost/locations/countries' });
            const response = await MockedLocationController.getCountries(req);
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            expect(body.message).toBe(RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        });
    });

    describe('getCountryById', () => {
        it('[Success] should fetch country by ID successfully', async () => {
            const mockCountry = { id: '1', name: 'India' };
            LocationService.getCountryById = jest.fn().mockResolvedValue(mockCountry);

            const req = createMockReq();
            const response = await MockedLocationController.getCountryById(req, { params: { id: '1' } });
            const body = await response.json();

            expect(LocationService.getCountryById).toHaveBeenCalledWith('1');
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.LOCATION.FETCHED);
            expect(body.data).toEqual({ country: mockCountry });
        });

        it('[Failure] should return NOT_FOUND if country does not exist', async () => {
            LocationService.getCountryById = jest.fn().mockResolvedValue(null);

            const req = createMockReq();
            const response = await MockedLocationController.getCountryById(req, { params: { id: 'invalid-id' } });
            const body = await response.json();

            expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
            expect(body.message).toBe(RESPONSE_MESSAGES.ERROR.NOT_FOUND);
        });
    });

    describe('getStatesByCountry', () => {
        it('[Success] should fetch states by country ID successfully', async () => {
            const mockStates = { states: [{ id: '1', name: 'Himachal Pradesh' }], total: 1 };
            LocationService.getStatesByCountry = jest.fn().mockResolvedValue(mockStates);

            const req = createMockReq({ url: 'http://localhost/locations/countries/1/states?page=1' });
            const response = await MockedLocationController.getStatesByCountry(req, { params: { id: '1' } });
            const body = await response.json();

            expect(LocationService.getStatesByCountry).toHaveBeenCalledWith('1', 1);
            expect(response.status).toBe(HTTP_STATUS.OK);
            expect(body.message).toBe(RESPONSE_MESSAGES.LOCATION.FETCHED);
            expect(body.data).toEqual(mockStates);
        });
    });
});
