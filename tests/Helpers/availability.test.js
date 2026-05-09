import { jest } from '@jest/globals';
import { calculateAvailability } from '@/core/Helpers/availability.js';

describe('Availability Helper', () => {
    test('should calculate availability for Rooms', () => {
        const obj = {
            total: 10,
            occupied: 2,
            booked: 1,
            maintenance: 1,
            cancelled: 0
        };
        const result = calculateAvailability(obj);
        expect(result.available).toBe(6);
    });

    test('should calculate availability for Seats with returns', () => {
        const obj = {
            total: 50,
            booked: 10,
            cancelled: 2
        };
        const result = calculateAvailability(obj);
        expect(result.available).toBe(42); // 50 - 10 + 2
    });

    test('should handle Mongoose .set() method', () => {
        const setMock = jest.fn();
        const obj = {
            total: 5,
            booked: 2,
            set: setMock
        };
        calculateAvailability(obj);
        expect(setMock).toHaveBeenCalledWith('available', 3);
    });

    test('should return input if total key is missing', () => {
        const obj = { name: 'Test' };
        const result = calculateAvailability(obj);
        expect(result.available).toBe(0); // math handles missing as 0, so 0 - 0 = 0. Wait, original implementation gives 0
    });

    test('should handle missing values as 0', () => {
        const obj = { total: 10 };
        const result = calculateAvailability(obj);
        expect(result.available).toBe(10);
    });
});
