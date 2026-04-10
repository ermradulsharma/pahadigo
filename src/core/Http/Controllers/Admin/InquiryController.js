import PolicyService from '../../../Services/Admin/PolicyService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * InquiryController (Admin Role)
 * Platform-wide consumer support, contact management, and inquiries.
 */
class InquiryController extends Controller {

  // POST /admin/inquiries (Public or Authenticated)
  async submitInquiry(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      if (!body.name || !body.email || !body.message) {
        return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);
      }
      const inquiry = await PolicyService.submitInquiry(body);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.INQUIRY.SUBMITTED, { inquiry });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/inquiries
  async getInquiries(req) {
    try {
      const inquiries = await PolicyService.getInquiries();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.INQUIRIES_FETCHED, { inquiries });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/inquiries/:id
  async updateInquiry(req, { params }) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const inquiry = await PolicyService.updateInquiry(params.id, body);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { inquiry });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/inquiries/:id
  async deleteInquiry(req, { params }) {
    try {
      await PolicyService.deleteInquiry(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const inquiryController = new InquiryController();
export default inquiryController;
