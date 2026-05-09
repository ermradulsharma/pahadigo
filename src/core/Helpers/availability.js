/**
 * Utility to calculate and sync availability based on business logic.
 * 
 * Logic: Available = Total - (Occupied + Reserved + Booked + Rented + Maintenance) + Cancelled
 */
export const calculateAvailability = (availObj) => {
    if (!availObj) return availObj;

    const get = (key) => {
        const val = availObj[key];
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
        availObj.set('available', available);
    } else {
        availObj.available = available;
    }
    
    return availObj;
};

export default { calculateAvailability };
