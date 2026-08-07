import { Inventory, Package, Booking } from '@/core/Models/index.js';
import { formatDateKey, normalizeAvailability, determineDayStatus, calculateEffectivePrice } from '@/core/Helpers/InventoryHelper.js';

export async function getEffectiveDay(vendorId, itemId, serviceType, date, inventoryDoc = null, session = null) {
    const targetDateStr = formatDateKey(date);
    const targetDate = new Date(targetDateStr);

    const inv = inventoryDoc || await Inventory.findOne({ vendorId, itemId }).session(session).lean();
    const customDay = inv?.calendar?.find(d => formatDateKey(d.date) === targetDateStr);

    const isExclusive = serviceType === 'customTrip';
    const bookingQuery = {
        status: { $in: ['confirmed', 'pending'] },
        startDate: { $lt: new Date(new Date(targetDate).setHours(23, 59, 59, 999)) },
        endDate: { $gt: targetDate }
    };

    if (isExclusive) {
        bookingQuery.vendor = vendorId;
    } else {
        bookingQuery['item.itemId'] = itemId;
    }

    const liveBookings = await Booking.find(bookingQuery).session(session).lean();

    const pkg = await Package.findOne({ vendor: vendorId }).session(session).lean();
    if (!pkg || !pkg[serviceType]) return null;

    const item = pkg[serviceType].find(i => String(i._id) === String(itemId));
    if (!item) return null;

    const { totalUnits } = normalizeAvailability(item);

    let liveBookedUnits = 0;
    const stayCategories = ['homestay', 'hotel', 'camping'];

    if (isExclusive && liveBookings.length > 0) {
        liveBookedUnits = totalUnits;
    } else if (stayCategories.includes(serviceType)) {
        // For stays, count units (rooms/tents). Fallback to 1 if not stored.
        liveBookedUnits = liveBookings.reduce((sum, b) => sum + (b.occupancy?.units || 1), 0);
    } else if (['bike-scooter-rental', 'vehicleRental', 'chardham-tour', 'chardhamTour'].includes(serviceType)) {
        // For rentals, count vehicles/units
        liveBookedUnits = liveBookings.reduce((sum, b) => sum + (b.occupancy?.units || 1), 0);
    } else {
        // For activities, count people (slots)
        liveBookedUnits = liveBookings.reduce((sum, b) => sum + ((b.occupancy?.adults || 0) + (b.occupancy?.children || 0) || 1), 0);
    }

    const baseItemPrice = item.pricing?.sellingPrice || 0;
    const finalPrice = calculateEffectivePrice(baseItemPrice, customDay?.pricing);

    const totalBooked = Math.max(customDay?.bookedUnits || 0, liveBookedUnits);
    const status = determineDayStatus(totalUnits, totalBooked, customDay?.status, item.isActive);

    return {
        date: targetDate,
        totalUnits,
        bookedUnits: totalBooked,
        availableUnits: Math.max(0, totalUnits - totalBooked),
        status: status,
        pricing: {
            basePrice: finalPrice,
            childPrice: customDay?.pricing?.childPrice || item.pricing?.childPrice || 0,
            extraBedPrice: customDay?.pricing?.extraBedPrice || item.pricing?.extraBedPrice || 0,
            porterPrice: customDay?.pricing?.porterPrice || item.pricing?.porterPricePerDay || 0
        }
    };
}
