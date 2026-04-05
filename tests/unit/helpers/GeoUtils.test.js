import { mapToGeoJSON } from '../../../src/core/Helpers/geoUtils.js';

describe('GeoUtils Helper Test Suite', () => {
    it('should convert latitude/longitude strings to GeoJSON point', () => {
        const obj = { latitude: '32.2396', longitude: '77.1887' };
        mapToGeoJSON(obj);
        
        expect(obj.coordinates.type).toBe('Point');
        expect(obj.coordinates.coordinates[0]).toBe(77.1887);
        expect(obj.coordinates.coordinates[1]).toBe(32.2396);
    });

    it('should ignore objects missing latitude or longitude', () => {
        const obj = { latitude: '32.2396' };
        mapToGeoJSON(obj);
        expect(obj.coordinates).toBeUndefined();
    });
});
