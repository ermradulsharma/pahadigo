import Country from '@/core/Models/Country.js';
import State from '@/core/Models/State.js';

/**
 * LocationService (General Role)
 * Handles public retrieval of countries and states.
 */
class LocationService {
  async getCountries(page = 1, limitParam = 10) {
    let limit = 10;
    if (limitParam === 'all') limit = 500;
    else if (limitParam) limit = Math.min(parseInt(limitParam), 500);

    const skip = (page - 1) * limit;
    const total = await Country.countDocuments({ status: 'active' });
    const countries = await Country.find({ status: 'active' }).sort({ name: 1 }).skip(skip).limit(limit);

    return {
      countries,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getCountryById(id) {
    return await Country.findById(id);
  }

  async getStatesByCountry(countryId, page = 1) {
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await State.countDocuments({ country: countryId, status: 'active' });
    const states = await State.find({ country: countryId, status: 'active' }).sort({ name: 1 }).skip(skip).limit(limit);

    return {
      states,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
}

export default new LocationService();
