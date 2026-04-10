import LocationService from '../../../Services/Admin/LocationService.js';
import { parseBody } from '@/helpers/parseBody.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '../Controller.js';

/**
 * LocationController (Admin Role)
 * Platform-wide geographic management, regional boundaries, and country/state taxonomy.
 */
class LocationController extends Controller {

  // POST /admin/locations/countries
  async createCountry(req) {
    try {
      const body = await parseBody(req);
      const country = await LocationService.createCountry(body);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.LOCATION.COUNTRY_CREATED, { country });
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST);
    }
  }

  // POST /admin/locations/states
  async createState(req) {
    try {
      const body = await parseBody(req);
      const state = await LocationService.createState(body);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.LOCATION.STATE_CREATED, { state });
    } catch (error) {
      return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST);
    }
  }

  // GET /admin/locations/countries
  async listCountries(req) {
    try {
      const countries = await LocationService.listCountries();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { countries });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/locations/states
  async listStates(req) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const countryId = url.searchParams.get('countryId');
      const states = await LocationService.listStates(countryId);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { states });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/locations/seed
  async seedLocations(req) {
    return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.SEED_INFO);
  }
}

const locationController = new LocationController();
export default locationController;
