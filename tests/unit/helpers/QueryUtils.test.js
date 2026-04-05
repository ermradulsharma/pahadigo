import { buildPaginationQuery, paginateArray } from '../../../src/core/Helpers/queryUtils.js';

describe('QueryUtils Helper Test Suite', () => {
    describe('buildPaginationQuery', () => {
        it('should extract values from URL', () => {
            const req = { 
                url: 'http://localhost/api?page=2&limit=5',
                headers: { get: () => 'localhost' }
            };
            const result = buildPaginationQuery(req);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(5);
            expect(result.skip).toBe(5);
        });

        it('should use defaults if params missing', () => {
            const result = buildPaginationQuery({});
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.skip).toBe(0);
        });
    });

    describe('paginateArray', () => {
        it('should slice array correctly', () => {
            const items = [1, 2, 3, 4, 5];
            const result = paginateArray(items, 2, 2);
            expect(result.items).toEqual([3, 4]);
            expect(result.pagination.total).toBe(5);
            expect(result.pagination.totalPages).toBe(3);
        });
    });
});
