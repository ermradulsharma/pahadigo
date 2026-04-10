import { apiHandler } from '../../../src/core/Helpers/apiHandler.js';
import { successResponse, errorResponse } from '../../../src/core/Helpers/response.js';
import { HTTP_STATUS } from '../../../src/core/Constants/index.js';
import AdminService from '../../../src/core/Services/AdminService.js';
import { jest } from '@jest/globals';

describe('ApiHandler Helper Test Suite', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should wrap success responses correctly', async () => {
        const handler = async () => successResponse(HTTP_STATUS.OK, 'Success', { test: 1 });
        const wrapped = apiHandler(handler);
        const req = { method: 'GET', url: 'http://localhost/api/test' };
        
        const res = await wrapped(req);
        expect(res.status).toBe(HTTP_STATUS.OK);
        const body = await res.json();
        expect(body.message).toBe('Success');
    });

    it('should trigger automatic audit log for POST requests with user', async () => {
        const spy = jest.spyOn(AdminService, 'logAction').mockResolvedValue({});
        const handler = async () => successResponse(HTTP_STATUS.CREATED, 'Created');
        const wrapped = apiHandler(handler);
        
        const req = { 
            method: 'POST', 
            url: 'http://localhost/api/vendor/add-item',
            user: { id: 'user-123' },
            jsonBody: { name: 'item' }
        };

        await wrapped(req);
        expect(spy).toHaveBeenCalled();
    });
    it('should return 500 and mask message on unhandled exceptions in handler', async () => {
        const handler = async () => { throw new Error('Sensitive Database Error'); };
        const wrapped = apiHandler(handler);
        const req = { method: 'GET', url: 'http://localhost' };
        
        const res = await wrapped(req);
        expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        const body = await res.json();
        expect(body.message).not.toBe('Sensitive Database Error'); // Should be masked
    });

    it('should sanitize NoSQL injection in the request body', async () => {
        const handler = async (req) => successResponse(HTTP_STATUS.OK, 'Done', req.jsonBody);
        const wrapped = apiHandler(handler);
        const req = { 
            method: 'POST', 
            url: 'http://localhost',
            jsonBody: { username: { $gt: "" }, password: "123" } 
        };
        
        const res = await wrapped(req);
        const body = await res.json();
        expect(body.data.username).toEqual({}); // $gt was stripped, leaving empty object
        expect(body.data.password).toBe('123');
    });
});
