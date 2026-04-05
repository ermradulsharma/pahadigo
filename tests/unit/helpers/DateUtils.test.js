import { getStartDateByPeriod } from '../../../src/core/Helpers/dateUtils.js';

describe('DateUtils Helper Test Suite', () => {
    it('should return start of the year for yearly period', () => {
        const start = getStartDateByPeriod('yearly');
        const now = new Date();
        expect(start.getFullYear()).toBe(now.getFullYear());
        expect(start.getMonth()).toBe(0); // January
        expect(start.getDate()).toBe(1);
    });

    it('should default to last month for monthly period', () => {
        const start = getStartDateByPeriod('monthly');
        const now = new Date();
        const expectedMonth = (now.getMonth() - 1 + 12) % 12;
        expect(start.getMonth()).toBe(expectedMonth);
    });
});
