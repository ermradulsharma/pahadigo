import { jest } from '@jest/globals';
import { syncLocation } from '@/core/Helpers/location.js';

describe('Location Helper (syncLocation)', () => {
    test('should create coordinates Point if not present', () => {
        const obj = { latitude: '32.2396', longitude: '77.1887' };
        const result = syncLocation(obj);
        expect(result.coordinates).toEqual({
            type: 'Point',
            coordinates: [77.1887, 32.2396]
        });
    });

    test('should update existing coordinates Point', () => {
        const obj = { 
            latitude: 33.3, 
            longitude: 78.8, 
            coordinates: { type: 'Point', coordinates: [0, 0] } 
        };
        const result = syncLocation(obj);
        expect(result.coordinates.coordinates).toEqual([78.8, 33.3]);
    });

    test('should use Mongoose .set() method if available', () => {
        const setMock = jest.fn();
        const obj = { 
            latitude: 10, 
            longitude: 20, 
            coordinates: {},
            set: setMock 
        };
        syncLocation(obj);
        expect(setMock).toHaveBeenCalledWith('coordinates.coordinates', [20, 10]);
    });

    test('should do nothing for invalid coordinates', () => {
        const obj = { latitude: 'invalid' };
        const result = syncLocation(obj);
        expect(result.coordinates).toBeUndefined();
    });
});
