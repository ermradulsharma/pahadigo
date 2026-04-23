import { syncLocation } from '@/helpers/location.js';

describe('Industry Standard: Location Helper Logic', () => {
    it('[Success] should sync coordinates from lat/lng strings', () => {
        const input = { latitude: '30.1', longitude: '78.2' };
        const result = syncLocation(input);
        expect(result.coordinates.coordinates).toEqual([78.2, 30.1]);
    });

    it('[Success] should sync coordinates from lat/lng numbers', () => {
        const input = { latitude: 35.5, longitude: 79.9 };
        const result = syncLocation(input);
        expect(result.coordinates.coordinates).toEqual([79.9, 35.5]);
    });

    it('[Bypass] should ignore invalid coordinates', () => {
        const input = { latitude: 'abc', longitude: '78.2' };
        const result = syncLocation(input);
        expect(result.coordinates).toBeUndefined();
    });
});
