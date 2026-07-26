import RazorpayService from '@/core/Services/General/RazorpayService.js';
import BookingService from '@/core/Services/General/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * PaymentController (Traveller Role) - Handles user-initiated payment flows.
 */
class PaymentController extends Controller {

    // POST /payment/create-order
    async createOrder(req) {
        if (!req.user?.id) return this.error(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED);
        const { bookingId } = req.validData || req.jsonBody || await req.json();

        try {
            const booking = await BookingService.getBookingById(bookingId);
            if (!booking) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.BOOKING.NOT_FOUND);

            const notes = {
                bookingId: booking._id.toString(),
                customerName: booking.user?.name || '',
                customerEmail: booking.user?.email || '',
                customerPhone: booking.user?.phone || '',
                packageName: booking.package?.title || 'Custom Booking'
            };

            const order = await RazorpayService.createOrder(booking.pricing.total, booking._id.toString(), notes);
            booking.payment.orderId = order.id;
            await booking.save();

            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PAYMENT.INITIATED, { order });
        } catch (err) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.PAYMENT.FAILED);
        }
    }

    // POST /payment/verify
    async verifyPayment(req) {
        try {
            const body = req.validData || req.jsonBody || await req.json();
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

            const isValid = RazorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            if (!isValid) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.PAYMENT.FAILED);

            await BookingService.updatePaymentStatus(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PAYMENT.VERIFIED, { success: true });
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const paymentController = new PaymentController();
export default paymentController;
