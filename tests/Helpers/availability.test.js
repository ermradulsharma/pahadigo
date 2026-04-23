import { calculateAvailability } from '@/helpers/availability.js';

describe('Industry Standard: Availability Helper Logic', () => {
    it('[Success] should calculate available rooms correctly', () => {
        const input = {
            totalRooms: 10,
            occupiedRooms: 2,
            reservedRooms: 1,
            cancelledRooms: 1
        };
        const result = calculateAvailability(input);
        // 10 - 2 - 1 + 1 = 8
        expect(result.availableRooms).toBe(8);
    });

    it('[Success] should work with vehicles suffix', () => {
        const input = {
            totalVehicles: 5,
            rentedVehicles: 3
        };
        const result = calculateAvailability(input);
        expect(result.availableVehicles).toBe(2);
    });

    it('[Mongoose] should support set method for documents', () => {
        const mockDoc = {
            totalSlots: 20,
            bookedSlots: 5,
            set: function(key, val) { this[key] = val; }
        };
        calculateAvailability(mockDoc);
        expect(mockDoc.availableSlots).toBe(15);
    });
});
