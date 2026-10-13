import { jest } from '@jest/globals';

const { addressPayload, getLocationPoint, mapToGeoJSON, syncLocation } = await import('@/core/Helpers/addressHelper.js');

describe('addressHelper Utility Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('addressPayload', () => {
        it('should format an address object into a single line comma-separated string', () => {
            const addr = {
                addressLine1: 'Near Hadimba Temple',
                addressLine2: 'Old Manali',
                city: 'Manali',
                state: 'Himachal Pradesh',
                country: 'India',
                pincode: '175131'
            };
            const result = addressPayload(addr);
            expect(result).toBe('Near Hadimba Temple, Old Manali, Manali, Himachal Pradesh, India, 175131');
        });

        it('should filter out null, undefined, empty and string "null" values', () => {
            const addr = {
                addressLine1: 'Mall Road',
                addressLine2: null,
                city: 'Shimla',
                state: 'undefined',
                country: 'India',
                pincode: ''
            };
            const result = addressPayload(addr);
            expect(result).toBe('Mall Road, Shimla, India');
        });

        it('should return trimmed string when given string input', () => {
            expect(addressPayload('  Kasol, Himachal Pradesh  ')).toBe('Kasol, Himachal Pradesh');
        });

        it('should return empty string for null or empty input', () => {
            expect(addressPayload(null)).toBe('');
            expect(addressPayload(undefined)).toBe('');
        });
    });

    describe('getLocationPoint', () => {
        it('should return coordinates array if already an array [lng, lat]', () => {
            expect(getLocationPoint({ coordinates: [77.1892, 32.2396] })).toEqual([77.1892, 32.2396]);
        });

        it('should extract from nested location.coordinates', () => {
            expect(getLocationPoint({ location: { coordinates: [77.1, 32.2] } })).toEqual([77.1, 32.2]);
        });

        it('should convert latitude/longitude into [lng, lat] GeoJSON format', () => {
            expect(getLocationPoint({ latitude: '32.2396', longitude: '77.1892' })).toEqual([77.1892, 32.2396]);
            expect(getLocationPoint({ lat: 32.2, lng: 77.1 })).toEqual([77.1, 32.2]);
        });

        it('should return null for invalid or missing coordinates', () => {
            expect(getLocationPoint(null)).toBeNull();
            expect(getLocationPoint({})).toBeNull();
            expect(getLocationPoint({ latitude: 'invalid', longitude: 'invalid' })).toBeNull();
        });
    });

    describe('mapToGeoJSON', () => {
        it('should mutate target object adding GeoJSON Point', () => {
            const obj = { latitude: 32.24, longitude: 77.18 };
            mapToGeoJSON(obj, 'coordinates');
            expect(obj.coordinates).toEqual({
                type: 'Point',
                coordinates: [77.18, 32.24]
            });
        });
    });

    describe('syncLocation', () => {
        it('should update locationObj with GeoJSON coordinates', () => {
            const loc = { latitude: '32.2', longitude: '77.1' };
            const synced = syncLocation(loc);
            expect(synced.coordinates).toEqual({
                type: 'Point',
                coordinates: [77.1, 32.2]
            });
        });

        it('should return original object if lat/lng is missing or invalid', () => {
            const invalid = { city: 'Manali' };
            expect(syncLocation(invalid)).toEqual(invalid);
            expect(syncLocation(null)).toBeNull();
        });
    });
});
