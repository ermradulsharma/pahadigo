import * as constants from '@/core/Constants/Package/accommodation.js';

describe('Constants: accommodation.js', () => {
    it('should export defined constants', () => {
        expect(constants).toBeDefined();
        const keys = Object.keys(constants);
        expect(keys.length).toBeGreaterThan(0);
        keys.forEach(key => {
            expect(constants[key]).toBeDefined();
        });
    });
});
