import { successResponse, errorResponse } from '../../../src/core/Helpers/response.js';
import { HTTP_STATUS } from '../../../src/core/Constants/index.js';

describe('Response Helper Test Suite', () => {
    it('should format success responses', async () => {
        const response = successResponse(HTTP_STATUS.OK, 'Done', { id: 1 });
        expect(response.status).toBe(HTTP_STATUS.OK);
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.message).toBe('Done');
        expect(body.data.id).toBe(1);
    });

    it('should format error responses', async () => {
        const response = errorResponse(HTTP_STATUS.BAD_REQUEST, 'Fail', { error: 'Invalid' });
        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.message).toBe('Fail');
        expect(body.data.error).toBe('Invalid');
    });
});
