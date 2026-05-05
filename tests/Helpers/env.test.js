import { jest } from '@jest/globals';
import { loadEnv } from '@/core/Helpers/env.js';
import fs from 'fs';

describe('Env Helper', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        jest.spyOn(fs, 'existsSync');
        jest.spyOn(fs, 'readFileSync');
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    test('should load variables from .env file', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('TEST_KEY=test_value\nANOTHER_KEY=another_value');

        loadEnv();

        expect(process.env.TEST_KEY).toBe('test_value');
        expect(process.env.ANOTHER_KEY).toBe('another_value');
    });

    test('should do nothing if .env file does not exist', () => {
        fs.existsSync.mockReturnValue(false);
        loadEnv();
        expect(process.env.TEST_KEY).toBeUndefined();
    });

    test('should handle empty or malformed lines', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readFileSync.mockReturnValue('INVALID_LINE\nVALID=value');

        loadEnv();

        expect(process.env.VALID).toBe('value');
    });
});
