import { getStartDateByPeriod } from '@/helpers/dateUtils.js';

describe('Industry Standard: Date Utility Logic', () => {
    it('[Yearly] should return start of current year', () => {
        const start = getStartDateByPeriod('yearly');
        const now = new Date();
        expect(start.getFullYear()).toBe(now.getFullYear());
        expect(start.getMonth()).toBe(0);
        expect(start.getDate()).toBe(1);
    });

    it('[Weekly] should return 7 days ago', () => {
        const start = getStartDateByPeriod('weekly');
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        const diffDays = Math.round(diff / (1000 * 3600 * 24));
        expect(diffDays).toBe(7);
    });

    it('[Monthly] should return approx 30 days ago by default', () => {
        const start = getStartDateByPeriod();
        const now = new Date();
        // Month difference check
        if (now.getMonth() === 0) {
            expect(start.getFullYear()).toBe(now.getFullYear() - 1);
            expect(start.getMonth()).toBe(11);
        } else {
            expect(start.getMonth()).toBe(now.getMonth() - 1);
        }
    });
});
