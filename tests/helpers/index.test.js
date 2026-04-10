import * as Helpers from '@/helpers/index.js';

describe('Helpers Index', () => {
    test('should export apiHandler', () => {
        expect(Helpers.apiHandler).toBeDefined();
    });

    test('should export auth helpers', () => {
        expect(Helpers.verifyToken).toBeDefined();
        expect(Helpers.generateToken).toBeDefined();
    });

    test('should export response helper', () => {
        expect(Helpers.response).toBeDefined();
    });

    test('should export validation helper', () => {
        expect(Helpers.validation).toBeDefined();
    });
});
