import { jest } from '@jest/globals';

describe('Industry Standard: Logger (Pino Wrapper)', () => {
    let loggerModule;

    beforeAll(async () => {
        loggerModule = await import('@/core/Lib/logger.js');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Default Logger] should export a functional Pino logger instance', () => {
        const logger = loggerModule.default;
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.debug).toBe('function');
    });

    it('[Contextual Logger] getLogger without requestId should return default logger', () => {
        const logger = loggerModule.default;
        const result = loggerModule.getLogger();
        expect(result).toBe(logger);
    });

    it('[Contextual Logger] getLogger with requestId should return child logger with requestId binding', () => {
        const logger = loggerModule.default;
        const childSpy = jest.spyOn(logger, 'child');

        const childLogger = loggerModule.getLogger('req_test_12345');
        expect(childSpy).toHaveBeenCalledWith({ requestId: 'req_test_12345' });
        expect(childLogger).toBeDefined();
        expect(typeof childLogger.info).toBe('function');

        childSpy.mockRestore();
    });
});
