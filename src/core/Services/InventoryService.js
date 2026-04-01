import Inventory from '@/models/Inventory.js';
import Package from '@/models/Package.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

class InventoryService {
    /**
     * INTERNAL HELPER: Get effective inventory data for a day.
     * Maps PackageSchema specific fields (totalRooms/totalSlots) to generic 'units'.
     */
    async _getEffectiveDay(vendorId, itemId, serviceType, date, inventoryDoc = null) {
        const targetDateStr = new Date(date).toISOString().split('T')[0];
        
        // 1. Try to find in custom inventory calendar
        const inv = inventoryDoc || await Inventory.findOne({ vendorId, itemId }).lean();
        const customDay = inv?.calendar.find(d => 
            new Date(d.date).toISOString().split('T')[0] === targetDateStr
        );

        if (customDay) return customDay;

        // 2. Fallback: Get base availability and pricing from Package
        const pkg = await Package.findOne({ vendor: vendorId }).lean();
        if (!pkg || !pkg[serviceType]) return null;

        const item = pkg[serviceType].find(i => i._id.toString() === itemId.toString());
        if (!item) return null;

        // Smart Mapping: Handle diverse schema keys (Availability vs FleetAvailability)
        let totalUnits = 0;
        if (item.fleetAvailability) {
            totalUnits = item.fleetAvailability.totalVehicles || 0;
        } else if (item.availability) {
            totalUnits = item.availability.totalRooms || item.availability.totalSlots || 0;
        }

        // Return a virtual record mimicking the schema
        return {
            date: new Date(date),
            totalUnits,
            bookedUnits: 0,
            availableUnits: totalUnits,
            status: item.isActive ? 'available' : 'closed',
            pricing: {
                basePrice: item.pricing?.pricePerNight || item.pricing?.pricePerPerson || item.pricing?.pricePerDay || item.pricing?.price || 0,
                childPrice: item.pricing?.childPrice || 0,
                extraBedPrice: item.pricing?.extraBedPrice || 0,
                porterPrice: item.pricing?.porterPricePerDay || 0
            },
            isVirtual: true
        };

        // If custom day exists, merge and apply adjustments
        let finalPrice = item.pricing?.pricePerNight || item.pricing?.pricePerPerson || item.pricing?.pricePerDay || item.pricing?.price || 0;
        
        if (customDay?.pricing?.basePrice !== null && customDay?.pricing?.basePrice !== undefined) {
            finalPrice = customDay.pricing.basePrice;
        } else {
            // Apply Adjustments to Baseline
            if (customDay?.pricing?.priceAdjustmentAmount) {
                finalPrice = parseFloat(finalPrice) + parseFloat(customDay.pricing.priceAdjustmentAmount);
            }
            if (customDay?.pricing?.priceAdjustmentPercent) {
                finalPrice = parseFloat(finalPrice) + (parseFloat(finalPrice) * (parseFloat(customDay.pricing.priceAdjustmentPercent) / 100));
            }
        }

        return {
            date: new Date(date),
            totalUnits,
            bookedUnits: customDay?.bookedUnits || 0,
            availableUnits: customDay ? Math.max(0, customDay.totalUnits - customDay.bookedUnits) : totalUnits,
            status: customDay?.status || (item.isActive ? 'available' : 'closed'),
            pricing: {
                basePrice: finalPrice, 
                childPrice: customDay?.pricing?.childPrice || item.pricing?.childPrice || 0,
                extraBedPrice: customDay?.pricing?.extraBedPrice || item.pricing?.extraBedPrice || 0,
                porterPrice: customDay?.pricing?.porterPrice || item.pricing?.porterPricePerDay || 0,
                adjustmentAmount: customDay?.pricing?.priceAdjustmentAmount || 0,
                adjustmentPercent: customDay?.pricing?.priceAdjustmentPercent || 0
            },
            isVirtual: !customDay
        };
    }

    /**
     * Retrieve calendar-based inventory for a specific item.
     */
    async getItemInventory(vendorId, itemId, serviceType, startDate, endDate) {
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
     * Retrieve inventory for ALL items within a specific service type for a vendor.
     * Perfect for a dashboard view of all rooms or all treks.
     */
    async getServiceInventory(vendorId, serviceType, startDate, endDate) {
        const pkg = await Package.findOne({ vendor: vendorId }).lean();
        if (!pkg || !pkg[serviceType]) return [];

        const items = pkg[serviceType];
        const result = [];

        for (const item of items) {
            const itemInventory = await this.getItemInventory(vendorId, item._id, serviceType, startDate, endDate);
            result.push({
                itemId: item._id,
                title: item.title,
                ...itemInventory
            });
        }

        return result;
    }

    /**
     * Bulk update availability for specific dates.
     */
    async updateInventory(vendorId, itemId, serviceType, updates) {
        let inv = await Inventory.findOne({ vendorId, itemId });

        if (!inv) {
            inv = new Inventory({ vendorId, itemId, serviceType, calendar: [] });
        }

        updates.forEach(update => {
            const dateStr = new Date(update.date).toISOString().split('T')[0];
            const existingIndex = inv.calendar.findIndex(d => 
                new Date(d.date).toISOString().split('T')[0] === dateStr
            );

            // Re-map totalUnits if provided, or preserve existing
            const total = update.totalUnits ?? (existingIndex > -1 ? inv.calendar[existingIndex].totalUnits : 0);
            const booked = update.bookedUnits ?? (existingIndex > -1 ? inv.calendar[existingIndex].bookedUnits : 0);

            const dayData = {
                date: new Date(update.date),
                totalUnits: total,
                bookedUnits: booked,
                availableUnits: Math.max(0, total - booked),
                status: update.status || 'available',
                pricing: {
                    basePrice: update.pricing?.basePrice ?? (existingIndex > -1 ? inv.calendar[existingIndex].pricing?.basePrice : null),
                    childPrice: update.pricing?.childPrice ?? (existingIndex > -1 ? inv.calendar[existingIndex].pricing?.childPrice : null),
                    extraBedPrice: update.pricing?.extraBedPrice ?? (existingIndex > -1 ? inv.calendar[existingIndex].pricing?.extraBedPrice : null),
                    porterPrice: update.pricing?.porterPrice ?? (existingIndex > -1 ? inv.calendar[existingIndex].pricing?.porterPrice : null),
                },
                note: update.note || ''
            };

            if (existingIndex > -1) {
                inv.calendar[existingIndex] = { ...inv.calendar[existingIndex].toObject(), ...dayData };
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
     * Initialize from Package for explicit overrides.
     */
    async initializeFromPackage(vendorId, itemId, serviceType, days = 30) {
        const pkg = await Package.findOne({ vendor: vendorId }).lean();
        if (!pkg || !pkg[serviceType]) return null;

        const item = pkg[serviceType].find(i => i._id.toString() === itemId.toString());
        if (!item) return null;

        // Smart Mapping: Handle diverse schema keys (Availability vs FleetAvailability)
        let totalUnits = 0;
        if (item.fleetAvailability) {
            totalUnits = item.fleetAvailability.totalVehicles || 0;
        } else if (item.availability) {
            totalUnits = item.availability.totalRooms || item.availability.totalSlots || 0;
        }
        
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

        return await this.updateInventory(vendorId, itemId, serviceType, initialCalendar);
    }

    /**
     * Check availability for range.
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
                    reason: dayData?.status !== 'available' ? 'Status: ' + dayData?.status : 'Insufficient units'
                };
            }
        }
        return { available: true };
    }

    /**
     * Reserve units.
     */
    async reserveSlotsRange(vendorId, itemId, serviceType, startDate, endDate, unitsToReserve = 1) {
        let inv = await Inventory.findOne({ vendorId, itemId });
        if (!inv) inv = new Inventory({ vendorId, itemId, serviceType, calendar: [] });

        const start = new Date(startDate);
        const end = new Date(endDate);
        const updates = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dayData = await this._getEffectiveDay(vendorId, itemId, serviceType, d, inv);
            const total = dayData.totalUnits || 0;
            const newBooked = (dayData.bookedUnits || 0) + unitsToReserve;

            if (newBooked > total) {
                throw new Error(`Insufficient units on ${d.toISOString().split('T')[0]}`);
            }

            updates.push({ date: new Date(d), bookedUnits: newBooked });
        }

        return await this.updateInventory(vendorId, itemId, serviceType, updates);
    }

    /**
     * Release units.
     */
    async releaseSlotsRange(vendorId, itemId, serviceType, startDate, endDate, unitsToRelease = 1) {
        let inv = await Inventory.findOne({ vendorId, itemId });
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
        return await this.updateInventory(vendorId, itemId, serviceType, updates);
    }

    async updateInventoryRange(vendorId, itemId, serviceType, startDate, endDate, settings) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const updates = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            updates.push({ date: new Date(d), ...settings });
        }
        return await this.updateInventory(vendorId, itemId, serviceType, updates);
    }

    /**
     * Update inventory for ALL items in a specific service/category.
     * Keeps baseline intact, only creates overrides in the Inventory model.
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
}

const inventoryService = new InventoryService();
export default inventoryService;

