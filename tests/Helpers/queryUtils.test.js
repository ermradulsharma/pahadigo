import { buildPaginationQuery, paginateArray } from '@/helpers/queryUtils.js';

describe('Industry Standard: Query Utility Logic', () => {
    describe('[buildPaginationQuery]', () => {
        it('[Success] should parse page and limit from URL', () => {
            const req = { url: 'http://test.com/api?page=2&limit=5' };
            const result = buildPaginationQuery(req);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(5);
            expect(result.skip).toBe(5);
        });

        it('[Defaults] should use defaults if missing or invalid', () => {
            const req = { url: 'http://test.com/api?page=abc' };
            const result = buildPaginationQuery(req, 10, 1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.skip).toBe(0);
        });
    });

    describe('[paginateArray]', () => {
        it('[Success] should slice array correctly', () => {
            const arr = [1, 2, 3, 4, 5];
            const result = paginateArray(arr, 2, 2);
            expect(result.items).toEqual([3, 4]);
            expect(result.pagination.total).toBe(5);
            expect(result.pagination.totalPages).toBe(3);
        });

        it('[Full] should return full array if limit is 0', () => {
            const arr = [1, 2];
            const result = paginateArray(arr, 1, 0);
            expect(result.items).toHaveLength(2);
            expect(result.pagination.totalPages).toBe(1);
        });
    });
});
