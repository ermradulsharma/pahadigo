import { jest } from '@jest/globals';
import { parseBody } from '@/core/Helpers/parseBody.js';

describe('ParseBody Helper', () => {
    test('should return jsonBody if already present on request', async () => {
        const req = { jsonBody: { test: 'data' } };
        const result = await parseBody(req);
        expect(result).toEqual({ test: 'data' });
    });

    test('should parse JSON from request', async () => {
        const req = {
            headers: { get: (name) => name === 'content-type' ? 'application/json' : null },
            json: jest.fn().mockResolvedValue({ key: 'value' })
        };
        const result = await parseBody(req);
        expect(result).toEqual({ key: 'value' });
    });

    test('should handle multipart/form-data', async () => {
        const mockFormData = {
            entries: () => [['name', 'test'], ['age', '20']]
        };
        const req = {
            headers: { get: (name) => name === 'content-type' ? 'multipart/form-data' : null },
            formData: jest.fn().mockResolvedValue(mockFormData)
        };
        const result = await parseBody(req);
        expect(result.name).toBe('test');
        expect(result.age).toBe('20');
    });

    test('should return empty object on parse error', async () => {
        const req = {
            headers: { get: () => 'application/json' },
            json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
        };
        const result = await parseBody(req);
        expect(result).toEqual({});
    });
});
