import Country from '@/models/Country.js';
import State from '@/models/State.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { parseBody } from '@/helpers/parseBody.js';

class LocationController {
    // Country Methods

    async getCountries(req) {
        try {
            const url = new URL(req.url);
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limitParam = url.searchParams.get('limit');
            let limit = 10;
            let skip = 0;

            if (limitParam === 'all') {
                limit = 500; // Hard cap instead of unlimited (0) to prevent memory exhaustion
            } else if (limitParam) {
                limit = Math.min(parseInt(limitParam), 500); // Cap explicitly provided limit
            }

            if (limit > 0) {
                skip = (page - 1) * limit;
            }

            const total = await Country.countDocuments({ status: 'active' });
            let query = Country.find({ status: 'active' }).sort({ name: 1 });

            if (limit > 0) {
                query = query.skip(skip).limit(limit);
            }

            const countries = await query;

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, {
                countries,
                pagination: {
                    total,
                    page,
                    limit: limit === 0 ? total : limit,
                    totalPages: limit === 0 ? 1 : Math.ceil(total / limit)
                }
            });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    async getCountryById(req, { params }) {
        try {
            const { id } = params;
            const country = await Country.findById(id);
            if (!country) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.NOT_FOUND, {});
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, { country });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /location/countries/:id/states
    async getStatesByCountry(req, { params }) {
        try {
            const { id } = params;
            const states = await State.find({ country: id }).sort({ name: 1 });
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, { states });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    async createCountry(req) {
        try {
            const body = await parseBody(req);
            const country = await Country.create(body);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.LOCATION.COUNTRY_CREATED, { country });
        } catch (error) {
            return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST, {});
        }
    }

    // State Methods

    async getStates(req) {
        try {
            const url = new URL(req.url); // Use standard URL interface as per Next.js Request or similar
            // Assuming req is standard Request object in App Router route handlers passed here, but existing code wraps it.
            // Let's check existing controllers to see how query params are handled.
            // Ah, usually standard URL parsing is used or helper.
            // Let's look at getStatesByCountryId mostly.

            const searchParams = url.searchParams;
            const countryId = searchParams.get('country');

            const filter = { status: 'active' };
            if (countryId) filter.country = countryId;

            const states = await State.find(filter).sort({ name: 1 }).populate('country', 'name isoCode');
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, { states });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // Explicit parameterized route handler if needed, or query based above
    async getStatesByCountry(req, { params }) {
        try {
            const { id } = params;
            const url = new URL(req.url);
            const page = parseInt(url.searchParams.get('page')) || 1;
            const limitParam = url.searchParams.get('limit');
            let limit = 10;
            let skip = 0;

            if (limitParam === 'all') {
                limit = 500; // Hard cap
            } else if (limitParam) {
                limit = Math.min(parseInt(limitParam), 500);
            }

            if (limit > 0) {
                skip = (page - 1) * limit;
            }

            const total = await State.countDocuments({ country: id, status: 'active' });
            let query = State.find({ country: id, status: 'active' }).sort({ name: 1 });

            if (limit > 0) {
                query = query.skip(skip).limit(limit);
            }

            const states = await query;

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.FETCHED, {
                states,
                pagination: {
                    total,
                    page,
                    limit: limit === 0 ? total : limit,
                    totalPages: limit === 0 ? 1 : Math.ceil(total / limit)
                }
            });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    async createState(req) {
        try {
            const body = await parseBody(req);
            const state = await State.create(body);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.LOCATION.STATE_CREATED, { state });
        } catch (error) {
            return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST, {});
        }
    }

    async seedLocations(req) {
        // This might be better as a standalone script, but API endpoint for dev convenience is fine
        // Keeping it empty or basic here, relying on CLI seeder instead as requested.
        return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.LOCATION.SEED_INFO, {});
    }
}

const locationController = new LocationController();
export default locationController;