import RazorpayService from '@/core/Services/General/RazorpayService.js';
import BookingService from '@/core/Services/General/BookingService.js';
import { HTTP_STATUS } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

const PAYMENT_EVENTS = new Set(['order.paid', 'payment.captured']);

const getNestedValue = (obj, path) => path.reduce((value, key) => value?.[key], obj);

const extractPaymentIdentifiers = (payload = {}) => ({
  orderId: getNestedValue(payload, ['order', 'entity', 'id']) || getNestedValue(payload, ['payment', 'entity', 'order_id']),
  paymentId: getNestedValue(payload, ['payment', 'entity', 'id'])
});

/**
 * PaymentController (General/Public Role) - Handles external payment webhooks.
 */
class PaymentController extends Controller {

  // POST /payment/webhook
  async webhook(req) {
    try {
      const signature = req.headers.get('x-razorpay-signature');
      const body = req.validData || req.jsonBody || await req.json();

      const isValid = await RazorpayService.verifyWebhookSignature(body, signature);
      if (!isValid) return this.error(HTTP_STATUS.BAD_REQUEST, 'Invalid signature');

      const { event, payload } = body || {};
      if (!event || !payload || typeof payload !== 'object') {
        return this.error(HTTP_STATUS.BAD_REQUEST, 'Invalid webhook payload');
      }

      if (PAYMENT_EVENTS.has(event)) {
        const { orderId, paymentId } = extractPaymentIdentifiers(payload);
        if (!orderId || !paymentId) {
          return this.error(HTTP_STATUS.BAD_REQUEST, 'Invalid payment webhook payload');
        }

        await BookingService.updatePaymentStatus(orderId, paymentId, 'WEBHOOK_VERIFIED');
      }

      return this.success(HTTP_STATUS.OK, 'Webhook processed', { received: true });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Webhook processing failed');
    }
  }
}

const paymentController = new PaymentController();
export default paymentController;
