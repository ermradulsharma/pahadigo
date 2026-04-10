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

    it('should mask detailed messages for 500 Internal Server Errors', async () => {
        const response = errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Root Password Leaked!');
        expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        const body = await response.json();
        expect(body.message).not.toBe('Root Password Leaked!');
        expect(body.message).toBe('Internal Server Error');
    });
});
