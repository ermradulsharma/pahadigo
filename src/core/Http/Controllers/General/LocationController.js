import LocationService from '@/core/Services/General/LocationService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * LocationController (General/Public Role) - Handles public listing of countries and states.
 */
class LocationController extends Controller {

  // GET /locations/countries
  async getCountries(req) {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page')) || 1;
      const limitParam = url.searchParams.get('limit');

      const result = await LocationService.getCountries(page, limitParam);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /locations/countries/:id
  async getCountryById(req, { params }) {
    try {
      const country = await LocationService.getCountryById(params.id);
      if (!country) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, { country });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /locations/countries/:id/states
  async getStatesByCountry(req, { params }) {
    try {
      const url = new URL(req.url);
      const page = parseInt(url.searchParams.get('page')) || 1;

      const result = await LocationService.getStatesByCountry(params.id, page);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const locationController = new LocationController();
export default locationController;
