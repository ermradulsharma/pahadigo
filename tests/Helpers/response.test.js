import { successResponse, errorResponse } from '@/helpers/response.js';

describe('Industry Standard: Response Helper Logic', () => {
    it('[Success] should create a success response with correct JSON and status', async () => {
        const response = successResponse(200, 'Test Success', { foo: 'bar' });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toBe('Test Success');
        expect(data.data.foo).toBe('bar');
    });

    it('[Error] should create an error response with correct JSON and status', async () => {
        const response = errorResponse(400, 'Test Error', { err: 'msg' });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.message).toBe('Test Error');
        expect(data.data.err).toBe('msg');
    });
});
