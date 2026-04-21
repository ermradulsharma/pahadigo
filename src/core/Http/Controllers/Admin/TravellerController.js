import TravellerService from '../../../Services/Admin/TravellerService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * TravellerController (Admin Role)
 * Platform-wide administration of traveller accounts, identity lifecycle, and activity.
 */
class TravellerController extends Controller {

  // GET /admin/travellers
  async getTravellers(req) {
    try {
      const travellers = await TravellerService.getAllTravellers();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { travellers });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/travellers/create
  async createTraveller(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const traveller = await TravellerService.createTraveller(body, req);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { traveller });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/travellers/:id/update
  async updateTraveller(req, { params }) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const traveller = await TravellerService.updateTraveller(params.id, body, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.TRAVELLER.UPDATED, { traveller });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/travellers/:id/delete
  async deleteTraveller(req, { params }) {
    try {
      await TravellerService.deleteTraveller(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.TRAVELLER.DELETED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const travellerController = new TravellerController();
export default travellerController;
