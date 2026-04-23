import { jest } from '@jest/globals';
import { generateId, createMockReq } from './testUtils.js';

describe('Test Utilities', () => {
    describe('generateId', () => {
        it('should return a valid MongoDB ObjectId', () => {
            const id = generateId();
            expect(id).toBeDefined();
            expect(id.toString()).toHaveLength(24);
        });
    });

    describe('createMockReq', () => {
        it('should create a request object with headers and params', () => {
            const req = createMockReq({
                jsonBody: { foo: 'bar' },
                headers: { 'X-Test': 'Value' },
                params: { id: '123' }
            });

            expect(req.jsonBody.foo).toBe('bar');
            expect(req.headers.get('x-test')).toBe('Value');
            expect(req.params.id).toBe('123');
        });

        it('should handle search params correctly', () => {
            const req = createMockReq({ url: 'http://localhost?page=2&limit=10' });
            expect(req.nextUrl.searchParams.get('page')).toBe('2');
            expect(req.nextUrl.searchParams.get('limit')).toBe('10');
        });
    });
});
