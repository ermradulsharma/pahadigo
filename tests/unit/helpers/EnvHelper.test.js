import { loadEnv } from '../../../src/core/Helpers/env.js';
import fs from 'fs';
import path from 'path';
import { jest } from '@jest/globals';

describe('Env Helper Test Suite', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should load variables from .env file', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue('TEST_KEY=test_value\nANOTHER_KEY=another_value');
        
        loadEnv();
        
        expect(process.env.TEST_KEY).toBe('test_value');
        expect(process.env.ANOTHER_KEY).toBe('another_value');
    });

    it('should do nothing if .env file does not exist', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        const readSpy = jest.spyOn(fs, 'readFileSync');
        
        loadEnv();
        
        expect(readSpy).not.toHaveBeenCalled();
    });

    it('should handle malformed lines', () => {
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'readFileSync').mockReturnValue('INVALID_LINE\nKEY_ONLY=\n=VALUE_ONLY');
        
        loadEnv();
        
        expect(process.env.INVALID_LINE).toBeUndefined();
    });
});
