import { jest } from '@jest/globals';

jest.unstable_mockModule('fs', () => ({
    default: {
        existsSync: jest.fn(),
        readFileSync: jest.fn()
    }
}));

const fs = (await import('fs')).default;
const { loadEnv } = await import('@/helpers/env.js');

describe('Industry Standard: Environment Loader Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should parse and load variables from .env file', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('TEST_KEY=test_value\nANOTHER_KEY = another_value');

        loadEnv();

        expect(process.env.TEST_KEY).toBe('test_value');
        expect(process.env.ANOTHER_KEY).toBe('another_value');
    });

    it('[Success] should do nothing if .env file does not exist', () => {
        fs.existsSync.mockReturnValue(false);
        loadEnv();
        // Just checking it doesn't crash
    });
});
