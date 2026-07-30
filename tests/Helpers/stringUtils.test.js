import * as helpers from '@/core/Helpers/stringUtils.js';

describe('Helpers: stringUtils.js', () => {
    it('should export expected functions or objects', () => {
        expect(helpers).toBeDefined();
        const keys = Object.keys(helpers);
        expect(keys.length).toBeGreaterThan(0);
        keys.forEach(key => {
            expect(helpers[key]).toBeDefined();
        });
    });
    
    // Add specific test for stringUtils.slugify if this is stringUtils.js
    
    it('should slugify strings correctly', () => {
        expect(helpers.slugify('Hello World!')).toBe('hello-world');
        expect(helpers.slugify('   Test   --  --- Case   ')).toBe('test-case');
    });
});
