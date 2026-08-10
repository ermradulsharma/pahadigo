import PolicyService from '@/core/Services/Admin/PolicyService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const inquirySubmitSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10)
});

const inquiryUpdateSchema = z.object({
  status: z.enum(['pending', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignedTo: z.string().optional() // ObjectId as string
});

/**
 * InquiryController (Admin Role)
 * Platform-wide consumer support, contact management, and inquiries.
 */
class InquiryController extends Controller {

  // POST /admin/inquiries (Public or Authenticated)
  async submitInquiry(req) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(inquirySubmitSchema, rawBody);
      
      if (!success) {
          throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
      }

      const inquiry = await PolicyService.submitInquiry(data);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.INQUIRY.SUBMITTED, { inquiry });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/inquiries
  async getInquiries(req) {
    try {
      const inquiries = await PolicyService.getInquiries();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.INQUIRIES_FETCHED, { inquiries });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/inquiries/:id
  async updateInquiry(req, { params }) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(inquiryUpdateSchema, rawBody);
      
      if (!success) {
          throw new AppError(error, HTTP_STATUS.BAD_REQUEST);
      }

      const inquiry = await PolicyService.updateInquiry(params.id, data);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { inquiry });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/inquiries/:id
  async deleteInquiry(req, { params }) {
    try {
      await PolicyService.deleteInquiry(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const inquiryController = new InquiryController();
export default inquiryController;
