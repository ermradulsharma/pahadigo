import BookingService from '../../../Services/Admin/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * PaymentController (Admin Role) - Handles administrative auditing of payment history.
 * Aligned with the "Payment History" sidebar item.
 */
class PaymentController extends Controller {

  // GET /admin/payment-history (Router path)
  async getPaymentHistory(req) {
    try {
      const history = await BookingService.getPaymentHistory();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.PAYMENT_HISTORY_FETCHED, { history });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const paymentController = new PaymentController();
export default paymentController;
