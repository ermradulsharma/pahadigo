import RazorpayService from '@/services/RazorpayService.js';
import BookingService from '@/services/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { successResponse, errorResponse } from '@/helpers/response.js';

class PaymentController {

   // POST /payment/create-order
   async createOrder(req) {
      const user = req.user;
      if (!user) return errorResponse(HTTP_STATUS.UNAUTHORIZED, RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, {});

      const body = req.jsonBody || await req.json();
      const { bookingId } = body;

      try {
         const booking = await BookingService.getBookingById(bookingId);
         if (!booking) {
            return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.BOOKING.NOT_FOUND, {});
         }

         const order = await RazorpayService.createOrder(booking.totalPrice, booking._id.toString());

         booking.razorpay.orderId = order.id;
         await booking.save();

         return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.PAYMENT.INITIATED, { order });
      } catch (err) {
         return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.PAYMENT.FAILED, {});
      }
   }

   // POST /payment/verify
   async verifyPayment(req) {
      try {
         const body = req.jsonBody || await req.json();
         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

         const isValid = RazorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

         if (isValid) {
            await BookingService.updatePaymentStatus(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.PAYMENT.VERIFIED, { success: true });
         } else {
            return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.PAYMENT.FAILED, { success: false, error: 'Signature verification failed' });
         }
      } catch (error) {
         const status = error.message === 'Booking order mismatch' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
         const msg = error.message === 'Booking order mismatch' ? RESPONSE_MESSAGES.BOOKING.NOT_FOUND : RESPONSE_MESSAGES.ERROR.SERVER_ERROR;
         return errorResponse(status, msg, {});
      }
   }
}

const paymentController = new PaymentController();
export default paymentController;