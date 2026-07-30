import * as constants from '@/core/Constants/Package/transport.js';

describe('Constants: transport.js', () => {
    it('should export defined constants', () => {
        expect(constants).toBeDefined();
        const keys = Object.keys(constants);
        expect(keys.length).toBeGreaterThan(0);
        keys.forEach(key => {
            expect(constants[key]).toBeDefined();
        });
    });
});
