/**
 * Helper to format package items specifically for the Inventory Management view.
 * Focuses on capacity (availability/fleetAvailability) and pricing overrides.
 */
export function formatInventoryItem(item, categorySlug, vendorCategories = []) {
    const itemObj = item.toObject ? item.toObject() : item;
    const category = vendorCategories.find(c => (c.slug || '').toLowerCase() === (categorySlug || '').toLowerCase()) || { name: categorySlug, _id: "" };

    return {
        id: itemObj._id,
        title: itemObj.title,
        isActive: itemObj.isActive,
        pricing: itemObj.pricing || {},
        availability: normalizeAvailability(itemObj),
        category_name: category.name || "",
        category_slug: categorySlug,
        category_id: category._id || ""
    };
}

/**
 * Normalizes availability data from different schemas (homestay vs transport)
 */
export function normalizeAvailability(item) {
    if (!item) return {};
    return {
        totalUnits: item.fleetAvailability?.totalVehicles || item.availability?.totalRooms || item.availability?.totalSlots || item.availability?.totalSeats || 0,
        availableUnits: item.fleetAvailability?.availableVehicles || item.availability?.availableRooms || 0,
        bookedUnits: item.fleetAvailability?.rentedVehicles || item.availability?.occupiedRooms || item.availability?.bookedSlots || 0
    };
}

/**
 * Formats a date to YYYY-MM-DD string for internal calendar lookups.
 */
export function formatDateKey(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
}

/**
 * Logic to determine the final pricing for a specific day based on base price and overrides.
 */
export function calculateEffectivePrice(basePrice, overrides = {}) {
    let finalPrice = parseFloat(basePrice) || 0;

    if (overrides.basePrice !== null && overrides.basePrice !== undefined) {
        finalPrice = parseFloat(overrides.basePrice);
    } else {
        if (overrides.priceAdjustmentAmount) {
            finalPrice += parseFloat(overrides.priceAdjustmentAmount);
        }
        if (overrides.priceAdjustmentPercent) {
            finalPrice += (finalPrice * (parseFloat(overrides.priceAdjustmentPercent) / 100));
        }
    }

    return Math.round(finalPrice * 100) / 100;
}

/**
 * Logic to determine the status of a specific day based on units and manual overrides.
 */
export function determineDayStatus(totalUnits, bookedUnits, manualStatus, itemIsActive) {
    if (manualStatus) return manualStatus;
    if (bookedUnits >= totalUnits) return 'sold_out';
    return itemIsActive ? 'available' : 'closed';
}
