import Country from '../models/Country.js';
import State from '../models/State.js';
import { successResponse, errorResponse } from '../helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/index.js';
import { parseBody } from '../helpers/parseBody.js';

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
                limit = 0; // Unlimited
            } else if (limitParam) {
                limit = parseInt(limitParam);
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

            return successResponse(HTTP_STATUS.OK, 'Countries fetched successfully', {
                countries,
                pagination: {
                    total,
                    page,
                    limit: limit === 0 ? total : limit,
                    totalPages: limit === 0 ? 1 : Math.ceil(total / limit)
                }
            });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    async getCountryById(req, { params }) {
        try {
            const { id } = params;
            const country = await Country.findById(id);
            if (!country) return errorResponse(HTTP_STATUS.NOT_FOUND, 'Country not found', {});
            return successResponse(HTTP_STATUS.OK, 'Country fetched successfully', { country });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    async createCountry(req) {
        try {
            const body = await parseBody(req);
            const country = await Country.create(body);
            return successResponse(HTTP_STATUS.CREATED, 'Country created successfully', { country });
        } catch (error) {
            return errorResponse(HTTP_STATUS.BAD_REQUEST, error.message, {});
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
            return successResponse(HTTP_STATUS.OK, 'States fetched successfully', { states });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
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
                limit = 0;
            } else if (limitParam) {
                limit = parseInt(limitParam);
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

            return successResponse(HTTP_STATUS.OK, 'States fetched successfully', {
                states,
                pagination: {
                    total,
                    page,
                    limit: limit === 0 ? total : limit,
                    totalPages: limit === 0 ? 1 : Math.ceil(total / limit)
                }
            });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    async createState(req) {
        try {
            const body = await parseBody(req);
            const state = await State.create(body);
            return successResponse(HTTP_STATUS.CREATED, 'State created successfully', { state });
        } catch (error) {
            return errorResponse(HTTP_STATUS.BAD_REQUEST, error.message, {});
        }
    }

    async seedLocations(req) {
        // This might be better as a standalone script, but API endpoint for dev convenience is fine
        // Keeping it empty or basic here, relying on CLI seeder instead as requested.
        return successResponse(HTTP_STATUS.OK, 'Use CLI seeder for locations', {});
    }
}

const locationController = new LocationController();
export default locationController;
