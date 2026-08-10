import LocationService from '@/core/Services/Admin/LocationService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const countrySchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2).max(5).optional(),
  dial_code: z.string().optional(),
  currency: z.string().optional(),
  flag: z.string().optional(),
  isActive: z.boolean().optional()
});

const stateSchema = z.object({
  name: z.string().min(2),
  country: z.string().min(24),
  code: z.string().optional(),
  isActive: z.boolean().optional()
});

const stateUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  country: z.string().min(24).optional(),
  code: z.string().optional(),
  isActive: z.boolean().optional()
});

/**
 * LocationController (Admin Role)
 * Platform-wide geographic management, regional boundaries, and country/state taxonomy.
 */
class LocationController extends Controller {

  // POST /admin/locations/countries
  async createCountry(req) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(countrySchema, rawBody);
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const country = await LocationService.createCountry(data);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.LOCATION.COUNTRY_CREATED, { country });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST);
    }
  }

  // PATCH /admin/locations/countries/:id
  async updateCountry(req, { params }) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(countrySchema.partial(), rawBody);
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const country = await LocationService.updateCountry(params.id, data);
      return this.success(HTTP_STATUS.OK, 'Country updated successfully', { country });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/locations/countries/:id
  async deleteCountry(req, { params }) {
      try {
          await LocationService.deleteCountry(params.id);
          return this.success(HTTP_STATUS.OK, 'Country deleted successfully');
      } catch (error) {
          if (error instanceof AppError) return this.error(error.statusCode, error.message);
          return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
      }
  }

  // POST /admin/locations/states
  async createState(req) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(stateSchema, rawBody);
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const state = await LocationService.createState(data);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.LOCATION.STATE_CREATED, { state });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.BAD_REQUEST);
    }
  }

  // PATCH /admin/locations/states/:id
  async updateState(req, { params }) {
      try {
        const rawBody = await req.json();
        const { success, data, error } = validate(stateUpdateSchema, rawBody);
        if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

        const state = await LocationService.updateState(params.id, data);
        return this.success(HTTP_STATUS.OK, 'State updated successfully', { state });
      } catch (error) {
        if (error instanceof AppError) return this.error(error.statusCode, error.message);
        return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
      }
  }

  // DELETE /admin/locations/states/:id
  async deleteState(req, { params }) {
      try {
          await LocationService.deleteState(params.id);
          return this.success(HTTP_STATUS.OK, 'State deleted successfully');
      } catch (error) {
          if (error instanceof AppError) return this.error(error.statusCode, error.message);
          return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
      }
  }

  // GET /admin/locations/countries
  async listCountries(req) {
    try {
      const countries = await LocationService.listCountries();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { countries });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/locations/states
  async listStates(req) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost';
      const url = new URL(req.url, baseUrl);
      const countryId = url.searchParams.get('countryId');
      const states = await LocationService.listStates(countryId);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { states });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
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

