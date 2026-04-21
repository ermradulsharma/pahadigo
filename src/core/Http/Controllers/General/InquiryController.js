import PolicyService from '@/services/General/PolicyService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * InquiryController (General/Public Role) - Handles public submission of inquiries.
 */
class InquiryController extends Controller {

  // POST /inquiries (Public)
  async submitInquiry(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      if (!body.name || !body.email || !body.message) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS);

      const inquiry = await PolicyService.submitInquiry(body);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.INQUIRY.SUBMITTED, inquiry);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const inquiryController = new InquiryController();
export default inquiryController;
