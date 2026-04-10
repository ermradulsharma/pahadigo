import BookingService from '../../../Services/Admin/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * DisputeController (Admin Role) - Handles administrative dispute resolution.
 * Focused on resolving traveller-initiated booking disputes.
 */
class DisputeController extends Controller {

  // GET /admin/disputes
  async getDisputes(req) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const filter = {
        status: url.searchParams.get('status'),
        vendorId: url.searchParams.get('vendorId')
      };
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const result = await BookingService.getDisputes(filter, page, limit);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/disputes/:id
  async resolveDispute(req, { params }) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const { decision, adminNotes } = body;
      const updated = await BookingService.resolveDispute(req.user.id, params.id, decision, adminNotes, req);
      return this.success(HTTP_STATUS.OK, "Dispute resolved", { dispute: updated });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const disputeController = new DisputeController();
export default disputeController;
