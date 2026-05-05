import { jest } from '@jest/globals';
import { apiHandler } from '@/core/Helpers/apiHandler.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';

describe('apiHandler Helper', () => {
    let mockReq;
    let mockParams;

    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            method: 'GET',
            url: 'http://localhost/api/test',
            jsonBody: {},
            user: { id: 'user123' }
        };
        mockParams = { params: { id: '123' } };
        jest.spyOn(AuditService, 'logAction').mockResolvedValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should execute handler and return success response', async () => {
        const handler = jest.fn().mockResolvedValue('test_data');
        const wrapped = apiHandler(handler);

        const response = await wrapped(mockReq, mockParams);
        const body = await response.json();

        expect(response.status).toBe(HTTP_STATUS.OK);
        expect(body.data).toBe('test_data');
        expect(handler).toHaveBeenCalled();
    });

    test('should log audit action for POST requests', async () => {
        mockReq.method = 'POST';
        mockReq.url = 'http://localhost/api/booking/create';
        const handler = jest.fn().mockResolvedValue({ success: true, data: {} });
        const wrapped = apiHandler(handler);

        await wrapped(mockReq, mockParams);

        expect(AuditService.logAction).toHaveBeenCalled();
    });

    test('should handle errors in handler', async () => {
        const error = new Error('Test Error');
        error.status = HTTP_STATUS.BAD_REQUEST;
        const handler = jest.fn().mockRejectedValue(error);
        const wrapped = apiHandler(handler);

        const response = await wrapped(mockReq, mockParams);
        const body = await response.json();

        expect(response.status).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(body.message).toBe('Test Error');
    });

    test('should return 404 if handler is missing', async () => {
        const wrapped = apiHandler(null);
        const response = await wrapped(mockReq, mockParams);
        expect(response.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
});
