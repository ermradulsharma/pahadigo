import { buildPaginationQuery, paginateArray } from '@/core/Helpers/queryUtils.js';

describe('QueryUtils Helper', () => {
    describe('buildPaginationQuery', () => {
        test('should extract page and limit from URL', () => {
            const req = { url: 'http://localhost/api?page=2&limit=20' };
            const result = buildPaginationQuery(req);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(20);
            expect(result.skip).toBe(20);
        });

        test('should use defaults for missing params', () => {
            const req = { url: 'http://localhost/api' };
            const result = buildPaginationQuery(req, 10, 1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.skip).toBe(0);
        });
    });

    describe('paginateArray', () => {
        test('should slice array correctly', () => {
            const items = [1, 2, 3, 4, 5];
            const result = paginateArray(items, 2, 2);
            expect(result.items).toEqual([3, 4]);
            expect(result.pagination.total).toBe(5);
            expect(result.pagination.totalPages).toBe(3);
        });

        test('should return all items if limit is 0', () => {
            const items = [1, 2, 3];
            const result = paginateArray(items, 1, 0);
            expect(result.items).toHaveLength(3);
            expect(result.pagination.totalPages).toBe(1);
        });
    });
});
