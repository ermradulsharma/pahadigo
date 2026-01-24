import RazorpayService from '../services/RazorpayService.js';
import BookingService from '../services/BookingService.js';

class PaymentController {

   // POST /payment/create-order
   async createOrder(req) {
      const user = req.user;
      if (!user) return { status: 401, data: { error: 'Unauthorized' } };

      const body = await req.json();
      const { bookingId } = body;

      try {
         const booking = await BookingService.getBookingById(bookingId);
         if (!booking) {
            return { status: 404, data: { error: 'Booking not found' } };
         }

         const order = await RazorpayService.createOrder(booking.totalPrice, booking._id.toString());

         booking.razorpay.orderId = order.id;
         await booking.save();

         return { status: 200, data: { order } };
      } catch (err) {
         console.error('Payment Error:', err);
         return { status: 500, data: { error: 'Payment initialization failed' } };
      }
   }

   // POST /payment/verify
   async verifyPayment(req) {
      try {
         const body = await req.json();
         const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

         const isValid = RazorpayService.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

         if (isValid) {
            await BookingService.updatePaymentStatus(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            return { status: 200, data: { message: 'Payment verified', success: true } };
         } else {
            return { status: 400, data: { error: 'Signature verification failed', success: false } };
         }
      } catch (error) {
         console.error('Verify Payment Error:', error);
         const status = error.message === 'Booking order mismatch' ? 404 : 500;
         return { status, data: { error: error.message } };
      }
   }
}

export default new PaymentController();
