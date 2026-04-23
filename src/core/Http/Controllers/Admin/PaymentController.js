import BookingService from '@/core/Services/Admin/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

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

  // POST /admin/payments/payout
  async payoutBooking(req) {
    try {
      const data = req.jsonBody || {};
      const result = await BookingService.payoutBooking(data, req);
      return this.success(HTTP_STATUS.OK, "Settlement Vector Finalized", { result });
    } catch (error) {
      console.error("Payout Error:", error);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
  }

  // POST /admin/payments/refund
  async refundBooking(req) {
    try {
      const data = req.jsonBody || {};
      const result = await BookingService.refundBooking(data, req);
      return this.success(HTTP_STATUS.OK, "Fund Refund Sequence Executed", { result });
    } catch (error) {
      console.error("Refund Error:", error);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
    }
  }
}

const paymentController = new PaymentController();
export default paymentController;
