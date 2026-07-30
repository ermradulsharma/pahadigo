import { validateEnv } from '@/core/Config/envValidator';
import chalk from 'chalk';
import { jest } from '@jest/globals';

describe('envValidator', () => {
    let originalEnv;
    let exitSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        originalEnv = process.env;
        exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.restoreAllMocks();
    });

    it('should pass in test environment without validating', () => {
        process.env = { ...originalEnv, NODE_ENV: 'test' };
        validateEnv();
        expect(exitSpy).not.toHaveBeenCalled();
    });

    it('should fail and exit when required vars are missing', () => {
        process.env = { ...originalEnv, NODE_ENV: 'development' };
        delete process.env.MONGODB_URI;
        delete process.env.JWT_SECRET;
        
        validateEnv();
        
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('should pass when all required vars are present', () => {
        process.env = {
            ...originalEnv,
            NODE_ENV: 'development',
            MONGODB_URI: 'mongodb://localhost',
            JWT_SECRET: 'a_very_long_secret_key_that_is_32_chars_at_least',
            PORT: '3000'
        };
        
        validateEnv();
        
        expect(exitSpy).not.toHaveBeenCalled();
    });
});
