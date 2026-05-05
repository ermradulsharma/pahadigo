import { jest } from '@jest/globals';
import { calculateAvailability } from '@/core/Helpers/availability.js';

describe('Availability Helper', () => {
    test('should calculate availability for Rooms', () => {
        const obj = {
            totalRooms: 10,
            occupiedRooms: 2,
            bookedRooms: 1,
            maintenanceRooms: 1,
            cancelledRooms: 0
        };
        const result = calculateAvailability(obj);
        expect(result.availableRooms).toBe(6);
    });

    test('should calculate availability for Seats with returns', () => {
        const obj = {
            totalSeats: 50,
            bookedSeats: 10,
            cancelledSeats: 2
        };
        const result = calculateAvailability(obj);
        expect(result.availableSeats).toBe(42); // 50 - 10 + 2
    });

    test('should handle Mongoose .set() method', () => {
        const setMock = jest.fn();
        const obj = {
            totalTents: 5,
            bookedTents: 2,
            set: setMock
        };
        calculateAvailability(obj);
        expect(setMock).toHaveBeenCalledWith('availableTents', 3);
    });

    test('should return input if total key is missing', () => {
        const obj = { name: 'Test' };
        const result = calculateAvailability(obj);
        expect(result).toBe(obj);
    });

    test('should handle missing values as 0', () => {
        const obj = { totalSlots: 10 };
        const result = calculateAvailability(obj);
        expect(result.availableSlots).toBe(10);
    });
});
