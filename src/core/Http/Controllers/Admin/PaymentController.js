import BookingService from '@/core/Services/Admin/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { validate, schemas } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

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
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/payments/payout
  async payoutBooking(req) {
    try {
      const validation = validate(schemas.adminPayout, req.payload || {});
      if (!validation.success) throw new AppError(validation.error, HTTP_STATUS.BAD_REQUEST);

      const result = await BookingService.payoutBooking(validation.data, req);
      return this.success(HTTP_STATUS.OK, "Settlement Vector Finalized", { result });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/payments/refund
  async refundBooking(req) {
    try {
      const validation = validate(schemas.adminRefund, req.payload || {});
      if (!validation.success) throw new AppError(validation.error, HTTP_STATUS.BAD_REQUEST);

      const result = await BookingService.refundBooking(validation.data, req);
      return this.success(HTTP_STATUS.OK, "Fund Refund Sequence Executed", { result });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const paymentController = new PaymentController();
export default paymentController;
