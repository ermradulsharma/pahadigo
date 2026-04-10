import * as Lib from '@/lib/index.js';

describe('Lib Index', () => {
    test('should export getAppConfig', () => {
        expect(Lib.getAppConfig).toBeDefined();
    });
});
