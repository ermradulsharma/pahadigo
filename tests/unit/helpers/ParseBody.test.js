import { parseBody } from '../../../src/core/Helpers/parseBody.js';

describe('ParseBody Helper Test Suite', () => {
    it('should use req.jsonBody if present', async () => {
        const req = { jsonBody: { test: 1 } };
        const result = await parseBody(req);
        expect(result.test).toBe(1);
    });

    it('should parse JSON content type', async () => {
        const req = { 
            headers: { 
                get: (name) => name === 'content-type' ? 'application/json' : null 
            },
            json: async () => ({ value: 123 })
        };
        
        const result = await parseBody(req);
        expect(result.value).toBe(123);
    });

    it('should handle failed parsing gracefully', async () => {
        const req = { 
            headers: { 
                get: (name) => name === 'application/json' 
            },
            json: async () => { throw new Error('Fail') }
        };
        const result = await parseBody(req);
        expect(result).toEqual({});
    });
});
