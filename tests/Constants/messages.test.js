import * as constants from '@/core/Constants/messages.js';

describe('Constants: messages.js', () => {
    it('should export defined constants', () => {
        expect(constants).toBeDefined();
        const keys = Object.keys(constants);
        expect(keys.length).toBeGreaterThan(0);
        keys.forEach(key => {
            expect(constants[key]).toBeDefined();
        });
    });
});
