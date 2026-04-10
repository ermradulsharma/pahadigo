import Country from '@/models/Country.js';
import State from '@/models/State.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '../Controller.js';

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
            let limit = 10;
            if (limitParam === 'all') limit = 500;
            else if (limitParam) limit = Math.min(parseInt(limitParam), 500);

            const skip = (page - 1) * limit;
            const total = await Country.countDocuments({ status: 'active' });
            const countries = await Country.find({ status: 'active' }).sort({ name: 1 }).skip(skip).limit(limit);

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, {
                countries,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
            });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /locations/countries/:id
    async getCountryById(req, { params }) {
        try {
            const country = await Country.findById(params.id);
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
            const limit = 10;
            const skip = (page - 1) * limit;

            const total = await State.countDocuments({ country: params.id, status: 'active' });
            const states = await State.find({ country: params.id, status: 'active' }).sort({ name: 1 }).skip(skip).limit(limit);

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, {
                states,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
            });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const locationController = new LocationController();
export default locationController;
