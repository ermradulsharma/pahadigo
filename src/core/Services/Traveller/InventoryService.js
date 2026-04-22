import { Inventory, Package, Booking } from '@/models/index.js';
import { formatDateKey, normalizeAvailability, determineDayStatus, calculateEffectivePrice } from '@/helpers/InventoryHelper.js';

/**
 * InventoryService (Traveller Role)
 * Focuses on availability checks and real-time inventory retrieval for booking purposes.
 */
class InventoryService {
    /**
     * INTERNAL HELPER: Get effective inventory data for a day.
     */
    async _getEffectiveDay(vendorId, itemId, serviceType, date, inventoryDoc = null, session = null) {
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
        } else {
            // For activities/rentals, count people.
            liveBookedUnits = liveBookings.reduce((sum, b) => sum + (b.occupancy?.adults + b.occupancy?.children || 1), 0);
        }

        const baseItemPrice = item.pricing?.pricePerNight || item.pricing?.pricePerPerson || item.pricing?.pricePerDay || item.pricing?.price || 0;
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

    /**
     * Bulk Availability Check (Industry Standard Optimization)
     */
    async checkAvailabilityRange(vendorId, itemId, serviceType, startDate, endDate, unitsRequired = 1, session = null, excludeBookingId = null) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const stayCategories = ['homestay', 'hotel', 'camping'];
        const isStay = stayCategories.includes(serviceType);
        const adjustedEnd = isStay ? new Date(new Date(end).setDate(end.getDate() - 1)) : end;

        // 1. Fetch Package Data to get Total Capacity
        const pkg = await Package.findOne({ vendor: vendorId }).session(session).lean();
        if (!pkg || !pkg[serviceType]) return { available: false, reason: 'Package not found' };
        const item = pkg[serviceType].find(i => String(i._id) === String(itemId));
        if (!item) return { available: false, reason: 'Item not found' };
        const { totalUnits } = normalizeAvailability(item);

        // 2. Fetch ALL Bookings in the range (Batch Query)
        // Industry Standard: Exclude expired pending bookings to free up slots automatically
        const now = new Date();
        const bookingQuery = {
            'item.itemId': itemId,
            $or: [
                { status: 'confirmed' },
                { status: 'pending', expiresAt: { $gt: now } }
            ],
            startDate: { $lte: adjustedEnd },
            endDate: { $gte: start }
        };

        if (excludeBookingId) {
            bookingQuery._id = { $ne: excludeBookingId };
        }

        const liveBookings = await Booking.find(bookingQuery).session(session).lean();

        // 3. Fetch Manual Inventory Overrides
        const inv = await Inventory.findOne({ vendorId, itemId }).session(session).lean();
        const calendarMap = new Map(inv?.calendar?.map(d => [formatDateKey(d.date), d]) || []);

        // 4. Daily Validation Loop (Memory-Based)
        for (let d = new Date(start); d <= adjustedEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDateKey(d);
            const customDay = calendarMap.get(dateStr);

            // Calculate live booked for this specific day
            let liveBooked = 0;
            liveBookings.forEach(b => {
                if (new Date(b.startDate) <= d && new Date(b.endDate) > d) {
                    if (isStay) {
                        liveBooked += (b.occupancy?.units || 1);
                    } else {
                        liveBooked += (b.occupancy?.adults + b.occupancy?.children || 1);
                    }
                }
            });

            const totalBooked = Math.max(customDay?.bookedUnits || 0, liveBooked);
            const available = Math.max(0, totalUnits - totalBooked);

            if (available < unitsRequired || (customDay && customDay.status === 'unavailable')) {
                return {
                    available: false,
                    failedDate: dateStr,
                    reason: available < unitsRequired ? 'Sold out' : 'Vendor blocked'
                };
            }
        }

        return { available: true };
    }

    /**
     * Atomic Slot Reservation
     */
    async reserveSlotsRange(vendorId, itemId, serviceType, startDate, endDate, unitsRequired = 1, session = null) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const isStay = ['homestay', 'hotel', 'camping'].includes(serviceType);
        const adjustedEnd = isStay ? new Date(new Date(end).setDate(end.getDate() - 1)) : end;

        const inv = await Inventory.findOne({ vendorId, itemId }).session(session);
        if (!inv) throw new Error("Inventory document not found for this item.");

        for (let d = new Date(start); d <= adjustedEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDateKey(d);
            let day = inv.calendar.find(cd => formatDateKey(cd.date) === dateStr);

            if (day) {
                day.bookedUnits = (day.bookedUnits || 0) + unitsRequired;
            } else {
                inv.calendar.push({
                    date: new Date(d),
                    bookedUnits: unitsRequired,
                    status: 'available'
                });
            }
        }
        await inv.save({ session });
    }

    /**
     * Atomic Slot Release
     */
    async releaseSlotsRange(vendorId, itemId, serviceType, startDate, endDate, unitsRequired = 1, session = null) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const isStay = ['homestay', 'hotel', 'camping'].includes(serviceType);
        const adjustedEnd = isStay ? new Date(new Date(end).setDate(end.getDate() - 1)) : end;

        const inv = await Inventory.findOne({ vendorId, itemId }).session(session);
        if (!inv) return;

        for (let d = new Date(start); d <= adjustedEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDateKey(d);
            let day = inv.calendar.find(cd => formatDateKey(cd.date) === dateStr);

            if (day) {
                day.bookedUnits = Math.max(0, (day.bookedUnits || 0) - unitsRequired);
            }
        }
        await inv.save({ session });
    }
}

export default new InventoryService();
