import { Inventory, Package, Booking } from '@/models/index.js';
import { formatDateKey, calculateEffectivePrice, normalizeAvailability, determineDayStatus } from '@/helpers/InventoryHelper.js';

/**
 * InventoryService (General/Traveller Role)
 * Focuses on availability checks and real-time inventory retrieval for booking purposes.
 */
class InventoryService {
    /**
     * INTERNAL HELPER: Get effective inventory data for a day.
     */
    async _getEffectiveDay(vendorId, itemId, serviceType, date, inventoryDoc = null) {
        const targetDateStr = formatDateKey(date);
        const targetDate = new Date(targetDateStr);

        const inv = inventoryDoc || await Inventory.findOne({ vendorId, itemId }).lean();
        const customDay = inv?.calendar?.find(d => formatDateKey(d.date) === targetDateStr);

        const isExclusive = serviceType === 'customTrip';
        const bookingQuery = {
            status: { $in: ['confirmed', 'pending'] },
            travelStartTime: { $lt: new Date(new Date(targetDate).setHours(23, 59, 59, 999)) },
            travelEndTime: { $gt: targetDate }
        };

        if (isExclusive) {
            bookingQuery.vendor = vendorId;
        } else {
            bookingQuery['preferences.itemId'] = itemId;
        }

        const liveBookings = await Booking.find(bookingQuery).lean();

        const pkg = await Package.findOne({ vendor: vendorId }).lean();
        if (!pkg || !pkg[serviceType]) return null;

        const item = pkg[serviceType].find(i => String(i._id) === String(itemId));
        if (!item) return null;

        const { totalUnits } = normalizeAvailability(item);

        let liveBookedUnits = 0;
        if (isExclusive && liveBookings.length > 0) {
            liveBookedUnits = totalUnits;
        } else {
            liveBookedUnits = liveBookings.reduce((sum, b) => sum + (b.units || 1), 0);
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
     * Public check for availability range (Used during Booking process).
     */
    async checkAvailabilityRange(vendorId, itemId, serviceType, startDate, endDate, unitsRequired = 1) {
        const inv = await Inventory.findOne({ vendorId, itemId }).lean();
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayData = await this._getEffectiveDay(vendorId, itemId, serviceType, d, inv);

            if (!dayData || dayData.status !== 'available' || dayData.availableUnits < unitsRequired) {
                return {
                    available: false,
                    failedDate: d.toISOString().split('T')[0],
                    reason: !dayData ? 'Item configuration error' : (dayData.status !== 'available' ? 'Status: ' + dayData.status : 'Sold out')
                };
            }
        }
        return { available: true };
    }

    /**
     * Reserve units (System/Booking).
     */
    async reserveSlotsRange(vendorId, itemId, serviceType, startDate, endDate, unitsToReserve = 1) {
        let inv = await Inventory.findOne({ vendorId, itemId });
        if (!inv) inv = new Inventory({ vendorId, itemId, serviceType, calendar: [] });

        const start = new Date(startDate);
        const end = new Date(endDate);
        const updates = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayData = await this._getEffectiveDay(vendorId, itemId, serviceType, d, inv);
            const total = dayData?.totalUnits || 0;
            const newBooked = (dayData?.bookedUnits || 0) + unitsToReserve;

            if (newBooked > total) {
                throw new Error(`Insufficient units on ${d.toISOString().split('T')[0]}`);
            }

            updates.push({ date: new Date(d), bookedUnits: newBooked });
        }

        // Apply updates
        for (const update of updates) {
            const dateStr = formatDateKey(update.date);
            const existingIndex = inv.calendar.findIndex(d => formatDateKey(d.date) === dateStr);
            if (existingIndex > -1) {
                inv.calendar[existingIndex].bookedUnits = update.bookedUnits;
            } else {
                inv.calendar.push({ ...update, status: 'available', totalUnits: 0 }); // Fallback
            }
        }
        await inv.save();
        return inv;
    }

    /**
     * Release units (System/Cancellation).
     */
    async releaseSlotsRange(vendorId, itemId, serviceType, startDate, endDate, unitsToRelease = 1) {
        const inv = await Inventory.findOne({ vendorId, itemId });
        if (!inv) return null;

        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = formatDateKey(d);
            const dayRecord = inv.calendar.find(day => formatDateKey(day.date) === dateStr);

            if (dayRecord) {
                dayRecord.bookedUnits = Math.max(0, dayRecord.bookedUnits - unitsToRelease);
            }
        }
        await inv.save();
        return inv;
    }
}

export default new InventoryService();
