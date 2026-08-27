import { jest } from '@jest/globals';

const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

const { validateEnv } = await import('@/core/Config/envValidator.js');

describe('envValidator', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should pass validation when all required env vars are present', () => {
        process.env.NODE_ENV = 'development';
        delete process.env.JEST_WORKER_ID;
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_SECRET = 'supersecret_must_be_at_least_32_characters_long_for_security';
        
        expect(() => validateEnv()).not.toThrow();
    });

    it('should fail and exit when required vars are missing in development', () => {
        process.env.NODE_ENV = 'development';
        delete process.env.JEST_WORKER_ID;
        delete process.env.MONGODB_URI;
        
        validateEnv();
        
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});
