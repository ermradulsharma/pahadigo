import Country from '@/core/Models/Country.js';
import State from '@/core/Models/State.js';
import CacheService from '@/core/Services/CacheService.js';
import AppError from '@/core/Helpers/AppError.js';
import { getCountryById, getCountriesBy, getStatesBy, updateById, deleteById } from '@/core/Helpers/queryHelpers.js';

/**
 * LocationService (Admin Role)
 * Administration of geographic taxonomies, countries, and regional boundaries.
 */
class LocationService {
  async createCountry(data) {
    const country = await Country.create(data);
    await CacheService.delete('admin:locations:countries');
    return country;
  }

  async updateCountry(id, data) {
    const country = await updateById(Country, id, data);
    if (!country) throw new AppError('Country not found', 404);
    await CacheService.delete('admin:locations:countries');
    return country;
  }

  async deleteCountry(id) {
    const deleted = await deleteById(Country, id);
    await CacheService.delete('admin:locations:countries');
    return deleted;
  }

  async createState(data) {
    const state = await State.create(data);
    await CacheService.deletePattern('admin:locations:states:*');
    return state;
  }

  async updateState(id, data) {
    const state = await updateById(State, id, data);
    if (!state) throw new AppError('State not found', 404);
    await CacheService.deletePattern('admin:locations:states:*');
    return state;
  }

  async deleteState(id) {
    const deleted = await deleteById(State, id);
    await CacheService.deletePattern('admin:locations:states:*');
    return deleted;
  }

  async getCountryById(id) {
    const cacheKey = `admin:locations:country:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;
    
    const country = await getCountryById(id);
    if (!country) throw new AppError('Country not found', 404);
    
    await CacheService.set(cacheKey, country, 300);
    return country;
  }

  async listCountries() {
    const cacheKey = 'admin:locations:countries';
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const countries = await getCountriesBy({}, '', null, { name: 1 });
    await CacheService.set(cacheKey, countries, 300);
    return countries;
  }

  async listStates(countryId = null) {
    const cacheKey = `admin:locations:states:${countryId || 'all'}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const query = countryId ? { country: countryId } : {};
    const states = await getStatesBy(query, '', null, { name: 1 });
    await CacheService.set(cacheKey, states, 300);
    return states;
  }
}

export default new LocationService();
