import RazorpayService from '@/services/RazorpayService.js';
import BookingService from '@/services/BookingService.js';
import { HTTP_STATUS } from '@/constants/index.js';

class PaymentController {

   // POST /payment/create-order
   async createOrder(req) {
      const user = req.user;
      if (!user) return { status: HTTP_STATUS.UNAUTHORIZED, data: { error: 'Unauthorized' } };

      const body = req.jsonBody || await req.json();
      const { bookingId } = body;

      try {
         const booking = await BookingService.getBookingById(bookingId);
         if (!booking) {
            return { status: HTTP_STATUS.NOT_FOUND, data: { error: 'Booking not found' } };
         }

         const order = await RazorpayService.createOrder(booking.totalPrice, booking._id.toString());

         booking.razorpay.orderId = order.id;
         await booking.save();

         return { status: HTTP_STATUS.OK, data: { order } };
      } catch (err) {
         return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, data: { error: 'Payment initialization failed' } };
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
            return { status: HTTP_STATUS.OK, data: { message: 'Payment verified', success: true } };
         } else {
            return { status: HTTP_STATUS.BAD_REQUEST, data: { error: 'Signature verification failed', success: false } };
         }
      } catch (error) {
         const status = error.message === 'Booking order mismatch' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
         return { status, data: { error: error.message } };
      }
   }
}

export default new PaymentController();