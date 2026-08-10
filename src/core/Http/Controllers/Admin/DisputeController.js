import BookingService from '@/core/Services/Admin/BookingService.js';
import MessageService from '@/core/Services/Admin/MessageService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const resolveDisputeSchema = z.object({
  decision: z.enum(['resolved_refunded', 'resolved_rejected']),
  adminNotes: z.string().optional()
});

const sendMessageSchema = z.object({
  message: z.string().min(1),
  target: z.enum(['all', 'traveller', 'vendor']).optional()
});

/**
 * DisputeController (Admin Role) - Handles administrative dispute resolution.
 * Focused on resolving traveller-initiated booking disputes.
 */
class DisputeController extends Controller {

  // GET /admin/disputes
  async getDisputes(req) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost';
      const url = new URL(req.url, baseUrl);
      const filter = { 
        status: url.searchParams.get('status'), 
        vendorId: url.searchParams.get('vendorId') 
      };
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const result = await BookingService.getDisputes(filter, page, limit);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, result);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/disputes/:id
  async resolveDispute(req, { params }) {
    try {
      const { success, data, error } = validate(resolveDisputeSchema, req.payload || {});
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const adminId = req.user?.id || null;
      const updated = await BookingService.resolveDispute(adminId, params.id, data.decision, data.adminNotes, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.DISPUTE.RESOLVED, updated);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/disputes/:id/messages
  async getMessages(req, { params }) {
    try {
      const messages = await MessageService.getMessages(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, messages);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/disputes/:id/messages
  async sendMessage(req, { params }) {
    try {
      const { success, data, error } = validate(sendMessageSchema, req.payload || {});
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
      
      const adminId = req.user?.id || null;
      const newMessage = await MessageService.sendMessage(params.id, adminId, 'User', data.message, data.target || 'all');
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, newMessage);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const disputeController = new DisputeController();
export default disputeController;
