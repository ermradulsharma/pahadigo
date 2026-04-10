import Country from '@/models/Country.js';
import State from '@/models/State.js';

/**
 * LocationService (Admin Role)
 * Administration of geographic taxonomies, countries, and regional boundaries.
 */
class LocationService {
    async createCountry(data) {
        return await Country.create(data);
    }

    async createState(data) {
        return await State.create(data);
    }

    async listCountries() {
        return await Country.find().sort({ name: 1 });
    }

    async listStates(countryId = null) {
        const query = countryId ? { country: countryId } : {};
        return await State.find(query).sort({ name: 1 });
    }
}

export default new LocationService();
