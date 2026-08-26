/**
 * Formats a structured address object into a clean, comma-separated single-line string.
 * @param {Object|string} addr - Address object or string
 * @returns {string} Single-line address string
 */
export const addressPayload = (addr) => {
    if (!addr) return '';
    if (typeof addr === 'string') return addr.trim();
    const rawParts = [addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.country, addr.pincode];
    const validParts = rawParts.filter(p => p !== null && p !== undefined).map(p => String(p).trim()).filter(p => p.length > 0 && p.toLowerCase() !== 'null' && p.toLowerCase() !== 'undefined');
    return validParts.join(', ');
};

/**
 * Extracts GeoJSON Location Point object from address details.
 * @param {Object} addr - Address object containing location or latitude/longitude
 * @returns {Object|null} GeoJSON Point object or null
 */
export const getLocationPoint = (addr) => {
    if (!addr || typeof addr !== 'object') return null;
    if (addr.location && Array.isArray(addr.location.coordinates) && addr.location.coordinates.length === 2) {
        return addr.location.coordinates;
    }
    const lat = parseFloat(addr.latitude);
    const lng = parseFloat(addr.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
        return [lng, lat];
    }
    return null;
};

export const getPoints = (addr) => {
    if (!addr || typeof addr !== 'object') return null;
    if (addr.location && Array.isArray(addr.location.coordinates) && addr.location.coordinates.length === 2) {
        return addr.location.coordinates;
    }
    const lat = parseFloat(addr.latitude);
    const lng = parseFloat(addr.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
        return [lng, lat];
    }
    return null;
};

/**
 * Maps standard latitude and longitude string/number values into a MongoDB GeoJSON Point object.
 * Mutates the original object by adding/updating the targeted property.
 * @param {Object} obj - The object containing `latitude` and `longitude` fields.
 * @param {String} targetProp - The property name to set the GeoJSON on. Default is 'coordinates'.
 */
export const mapToGeoJSON = (obj, targetProp = 'coordinates') => {
    if (obj && obj.latitude && obj.longitude) {
        obj[targetProp] = {
            type: 'Point',
            coordinates: [parseFloat(obj.longitude) || 0, parseFloat(obj.latitude) || 0]
        };
    }
};

/**
 * Synchronizes latitude/longitude in an object into a Mongoose GeoJSON coordinates object.
 * @param {Object} locationObj - Location object
 * @returns {Object} Updated location object
 */
export const syncLocation = (locationObj) => {
    if (!locationObj || typeof locationObj !== 'object') return locationObj;

    const lat = parseFloat(locationObj.latitude);
    const lng = parseFloat(locationObj.longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
        if (!locationObj.coordinates) {
            locationObj.coordinates = { type: 'Point', coordinates: [lng, lat] };
        } else {
            if (typeof locationObj.set === 'function') {
                locationObj.set('coordinates.coordinates', [lng, lat]);
            } else {
                locationObj.coordinates.coordinates = [lng, lat];
            }
        }
    }

    return locationObj;
};

export default {
    addressPayload,
    getLocationPoint,
    getPoints,
    mapToGeoJSON,
    syncLocation
};
