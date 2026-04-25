import BookingService from '@/core/Services/Admin/BookingService.js';
import MessageService from '@/core/Services/Admin/MessageService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * DisputeController (Admin Role) - Handles administrative dispute resolution.
 * Focused on resolving traveller-initiated booking disputes.
 */
class DisputeController extends Controller {

  // GET /admin/disputes
  async getDisputes(req) {
    try {
      const url = new URL(req.url);
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
      const { decision, adminNotes } = req.payload;
      const updated = await BookingService.resolveDispute(req.user.id, params.id, decision, adminNotes, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.DISPUTE.RESOLVED, updated);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/disputes/:id/messages
  async getMessages(req, { params }) {
    try {
      const messages = await MessageService.getMessages(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, messages);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/disputes/:id/messages
  async sendMessage(req, { params }) {
    try {
      const { message, target } = req.payload;
      const newMessage = await MessageService.sendMessage(params.id, req.user.id, 'User', message, target || 'all');
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, newMessage);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const disputeController = new DisputeController();
export default disputeController;
