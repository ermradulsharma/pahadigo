import { Country, State } from '@/core/Models/index.js';
import { getCountriesBy, getCountryById, getStatesBy, countBy } from '@/core/Helpers/queryHelpers.js';

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
    const total = await countBy(Country, { status: 'active' });
    const countries = await getCountriesBy({ status: 'active' }, '', null, { name: 1 }, { skip, limit });

    return {
      countries,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async getCountryById(id) {
    return await getCountryById(id);
  }

  async getStatesByCountry(countryId, page = 1) {
    const limit = 10;
    const skip = (page - 1) * limit;

    const total = await countBy(State, { country: countryId, status: 'active' });
    const states = await getStatesBy({ country: countryId, status: 'active' }, '', null, { name: 1 }, { skip, limit });

    return {
      states,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
}

export default new LocationService();
