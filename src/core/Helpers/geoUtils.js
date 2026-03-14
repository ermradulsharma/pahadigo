/**
 * Maps standard latitude and longitude string/number values into a MongoDB GeoJSON Point object.
 * Mutates the original object by adding/updating the targeted property.
 * 
 * @param {Object} obj - The object containing `latitude` and `longitude` fields.
 *                       Example: { latitude: '32.2396', longitude: '77.1887' }
 * @param {String} targetProp - The property name to set the GeoJSON on. Default is 'coordinates'.
 * @returns {void}
 */
export const mapToGeoJSON = (obj, targetProp = 'coordinates') => {
    if (obj && obj.latitude && obj.longitude) {
        obj[targetProp] = {
            type: 'Point',
            coordinates: [parseFloat(obj.longitude) || 0, parseFloat(obj.latitude) || 0]
        };
    }
};
