/**
 * Utility to calculate and sync availability based on business logic.
 * Handles varied unit types (Rooms, Tents, Seats, Slots, Passes, Vehicles).
 * 
 * Logic: Available = Total - (Occupied + Reserved + Booked + Rented + Maintenance) + Cancelled
 */
export const calculateAvailability = (availObj) => {
    if (!availObj) return availObj;

    // Convert to plain object if it's a Mongoose document to see schema keys properly
    const data = (availObj.toObject && typeof availObj.toObject === 'function') 
        ? availObj.toObject() 
        : availObj;

    if (typeof data !== 'object') return availObj;

    // Identify the unit suffix (e.g., 'Rooms', 'Tents', 'Seats')
    const totalKey = Object.keys(data).find(k => k.startsWith('total'));
    if (!totalKey) return availObj;

    const suffix = totalKey.replace('total', ''); // Extract 'Rooms', 'Tents', etc.
    const get = (prefix) => {
        const val = availObj[prefix + suffix];
        if (val === undefined || val === null) return 0;
        const parsed = parseInt(val);
        return isNaN(parsed) ? 0 : parsed;
    };

    const total = get('total');
    const occupied = get('occupied');
    const reserved = get('reserved');
    const booked = get('booked');
    const rented = get('rented');
    const maintenance = get('maintenance');
    const cancelled = get('cancelled');

    // Perform Math: Total minus all 'Unavailable' states plus 'Returns'
    const available = total - occupied - reserved - booked - rented - maintenance + cancelled;

    // Update the actual object/document
    if (availObj.set && typeof availObj.set === 'function') {
        availObj.set('available' + suffix, available);
    } else {
        availObj['available' + suffix] = available;
    }
    
    return availObj;
};
