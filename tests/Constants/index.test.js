import * as Constants from '@/constants/index.js';

describe('Constants Index', () => {
    test('should export USER_ROLES', () => {
        expect(Constants.USER_ROLES).toBeDefined();
        expect(Constants.USER_ROLES.ADMIN).toBe('admin');
    });

    test('should export HTTP_STATUS', () => {
        expect(Constants.HTTP_STATUS.OK).toBe(200);
        expect(Constants.HTTP_STATUS.NOT_FOUND).toBe(404);
    });

    test('should export RESPONSE_MESSAGES', () => {
        expect(Constants.RESPONSE_MESSAGES.SUCCESS.GENERIC).toBeDefined();
    });

    test('should export PACKAGE themes and types', () => {
        expect(Constants.PACKAGE.THEMES).toBeDefined();
        expect(Constants.PACKAGE.TYPES).toBeDefined();
    });
});
