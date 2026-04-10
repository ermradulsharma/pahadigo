import { Inventory, Package, Booking } from '@/models/index.js';
import { formatDateKey, normalizeAvailability, determineDayStatus, calculateEffectivePrice } from '@/helpers/InventoryHelper.js';

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
   * Find specific item inventory (Vendor View).
   */
  async findById(vendorId, itemId, serviceType, startDate, endDate) {
    const inv = await Inventory.findOne({ vendorId, itemId }).lean() || { calendar: [] };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const resultCalendar = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayData = await this._getEffectiveDay(vendorId, itemId, serviceType, d, inv);
      if (dayData) resultCalendar.push(dayData);
    }

    return { vendorId, itemId, serviceType, calendar: resultCalendar };
  }

  /**
   * Find all items inventory in category (Vendor View).
   * Supports optional filtering by itemId.
   */
  async findAllByCategory(vendorId, serviceType, startDate, endDate, itemId = null) {
    const pkg = await Package.findOne({ vendor: vendorId }).lean();
    if (!pkg || !pkg[serviceType]) return [];

    let items = pkg[serviceType];

    // Filter by itemId if provided
    if (itemId) {
      items = items.filter(item => String(item._id) === String(itemId));
    }

    const result = [];
    for (const item of items) {
      const itemInventory = await this.findById(vendorId, item._id, serviceType, startDate, endDate);
      result.push({
        itemId: item._id,
        title: item.title,
        ...itemInventory
      });
    }

    return result;
  }

  /**
   * Bulk update availability (Vendor Management).
   */
  async update(vendorId, itemId, serviceType, updates) {
    let inv = await Inventory.findOne({ vendorId, itemId });

    if (!inv) {
      inv = new Inventory({ vendorId, itemId, serviceType, calendar: [] });
    }

    updates.forEach(update => {
      const dateStr = formatDateKey(update.date);
      const existingIndex = inv.calendar.findIndex(d => formatDateKey(d.date) === dateStr);

      const total = update.totalUnits ?? (existingIndex > -1 ? inv.calendar[existingIndex].totalUnits : 0);
      const booked = update.bookedUnits ?? (existingIndex > -1 ? inv.calendar[existingIndex].bookedUnits : 0);

      const dayData = {
        date: new Date(update.date),
        totalUnits: total,
        bookedUnits: booked,
        availableUnits: Math.max(0, total - booked),
        status: update.status || (existingIndex > -1 ? inv.calendar[existingIndex].status : 'available'),
        pricing: {
          basePrice: update.pricing?.basePrice ?? (existingIndex > -1 ? inv.calendar[existingIndex].pricing?.basePrice : null),
          childPrice: update.pricing?.childPrice ?? (existingIndex > -1 ? inv.calendar[existingIndex].pricing?.childPrice : null),
          extraBedPrice: update.pricing?.extraBedPrice ?? (existingIndex > -1 ? inv.calendar[existingIndex].pricing?.extraBedPrice : null),
          porterPrice: update.pricing?.porterPrice ?? (existingIndex > -1 ? inv.calendar[existingIndex].pricing?.porterPrice : null),
        },
        note: update.note || (existingIndex > -1 ? inv.calendar[existingIndex].note : '')
      };

      if (existingIndex > -1) {
        Object.assign(inv.calendar[existingIndex], dayData);
      } else {
        inv.calendar.push(dayData);
      }
    });

    inv.calendar.sort((a, b) => new Date(a.date) - new Date(b.date));
    inv.lastSyncAt = new Date();
    await inv.save();
    return inv;
  }

  /**
   * Initialize from baseline (Vendor Action).
   */
  async initialize(vendorId, itemId, serviceType, days = 30) {
    const pkg = await Package.findOne({ vendor: vendorId }).lean();
    if (!pkg || !pkg[serviceType]) return null;

    const item = pkg[serviceType].find(i => i._id.toString() === itemId.toString());
    if (!item) return null;

    const { totalUnits } = normalizeAvailability(item);

    const initialCalendar = Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return {
        date: d,
        totalUnits,
        bookedUnits: 0,
        status: 'available'
      };
    });

    return await this.update(vendorId, itemId, serviceType, initialCalendar);
  }

  // Alias for initialization used by PackageService
  async initializeFromItem(vendorId, itemId, serviceType) {
    return this.initializeInventory(vendorId, itemId, serviceType);
  }

  /**
   * Reserve units (System/Booking).
   */
  async reserve(vendorId, itemId, serviceType, startDate, endDate, unitsToReserve = 1) {
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

    return await this.update(vendorId, itemId, serviceType, updates);
  }

  /**
   * Release units (System/Cancellation).
   */
  async release(vendorId, itemId, serviceType, startDate, endDate, unitsToRelease = 1) {
    const inv = await Inventory.findOne({ vendorId, itemId });
    if (!inv) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const updates = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().split('T')[0];
      const dayRecord = inv.calendar.find(day =>
        new Date(day.date).toISOString().split('T')[0] === dateStr
      );

      if (dayRecord) {
        updates.push({
          date: new Date(d),
          bookedUnits: Math.max(0, dayRecord.bookedUnits - unitsToRelease)
        });
      }
    }
    return await this.update(vendorId, itemId, serviceType, updates);
  }

  /**
   * Update range of inventory for an item (Industry Standard).
   */
  async updateInventoryRange(vendorId, itemId, serviceType, startDate, endDate, settings) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const updates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      updates.push({ date: new Date(d), ...settings });
    }
    return await this.update(vendorId, itemId, serviceType, updates);
  }

  /**
   * Update range of inventory for all items in a category (Industry Standard).
   */
  async updateServiceInventoryRange(vendorId, serviceType, startDate, endDate, settings) {
    const pkg = await Package.findOne({ vendor: vendorId }).lean();
    if (!pkg || !pkg[serviceType]) return null;

    const results = [];
    for (const item of pkg[serviceType]) {
      const res = await this.updateInventoryRange(vendorId, item._id, serviceType, startDate, endDate, settings);
      results.push(res);
    }
    return results;
  }

  // --- ALIASES FOR COMPATIBILITY ---
  async getInventoryByItemId(...args) { return this.findById(...args); }
  async getCategoryInventory(...args) { return this.findAllByCategory(...args); }
  async updateInventorySync(...args) { return this.update(...args); }
  async initializeInventory(...args) { return this.initialize(...args); }
  async updateInventory(...args) { return this.update(...args); }
  async reserveSlotsRange(...args) { return this.reserve(...args); }
  async releaseSlotsRange(...args) { return this.release(...args); }
}

export default new InventoryService();
