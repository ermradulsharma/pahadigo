import RazorpayService from '@/services/General/RazorpayService.js';
import BookingService from '@/services/General/BookingService.js';
import { HTTP_STATUS } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

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

            const { event, payload } = body;

            if (event === 'order.paid') {
                const orderId = payload.order.entity.id;
                const paymentId = payload.payment.entity.id;
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
