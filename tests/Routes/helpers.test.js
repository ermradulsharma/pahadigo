import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Helpers/apiHandler.js', () => ({
    apiHandler: jest.fn(m => m)
}));

const { wrap } = await import('@/routes/helpers.js');

describe('Industry Standard: Route Wrapper Logic', () => {
    it('[Success] should resolve and call controller method', async () => {
        const mockController = {
            testMethod: jest.fn().mockResolvedValue({ success: true })
        };
        
        const wrapped = wrap(mockController, 'testMethod');
        const result = await wrapped({}, {});

        expect(mockController.testMethod).toHaveBeenCalled();
        expect(result.success).toBe(true);
    });

    it('[Failure] should handle execution errors', async () => {
        const wrapped = wrap(null, 'method'); // Will throw
        const result = await wrapped({}, {});
        
        expect(result.status).toBe(500);
    });
});
