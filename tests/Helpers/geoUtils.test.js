import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';

describe('GeoUtils Helper', () => {
    test('should map latitude and longitude to GeoJSON Point', () => {
        const obj = { latitude: '32.2396', longitude: '77.1887' };
        mapToGeoJSON(obj);
        
        expect(obj.coordinates).toEqual({
            type: 'Point',
            coordinates: [77.1887, 32.2396]
        });
    });

    test('should handle numeric coordinates', () => {
        const obj = { latitude: 32.2396, longitude: 77.1887 };
        mapToGeoJSON(obj, 'location');
        
        expect(obj.location.coordinates).toEqual([77.1887, 32.2396]);
    });

    test('should do nothing if coordinates are missing', () => {
        const obj = { name: 'Test' };
        mapToGeoJSON(obj);
        expect(obj.coordinates).toBeUndefined();
    });

    test('should handle invalid coordinate strings', () => {
        const obj = { latitude: 'invalid', longitude: '77.1887' };
        mapToGeoJSON(obj);
        expect(obj.coordinates.coordinates[1]).toBe(0); // Latitude becomes 0
    });
});
