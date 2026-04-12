export const syncLocation = (locationObj) => {
  if (!locationObj || typeof locationObj !== 'object') return locationObj;

  const lat = parseFloat(locationObj.latitude);
  const lng = parseFloat(locationObj.longitude);

  if (!isNaN(lat) && !isNaN(lng)) {
    // Mongoose GeoJSON expects [longitude, latitude]
    if (!locationObj.coordinates) {
      locationObj.coordinates = { type: 'Point', coordinates: [lng, lat] };
    } else {
      // Using dot notation or set to ensure Mongoose sees the modification
      if (typeof locationObj.set === 'function') {
        locationObj.set('coordinates.coordinates', [lng, lat]);
      } else {
        locationObj.coordinates.coordinates = [lng, lat];
      }
    }
  }

  return locationObj;
};

export default { syncLocation };
