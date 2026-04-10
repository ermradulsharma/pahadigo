import BookingService from '../../../Services/Admin/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '../Controller.js';

/**
 * BookingController (Admin Role)
 * Platform-wide reservation management, financial settlement, and disputes.
 */
class BookingController extends Controller {

  // GET /admin/bookings
  async getAllBookings(req) {
    try {
      const bookings = await BookingService.getAllBookings();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED, { bookings });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/bookings/:id
  async show(req, { params }) {
    try {
      const booking = await BookingService.getBookingById(params.id);
      if (!booking) return this.error(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.BOOKING.NOT_FOUND);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED, { booking });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/payout
  async payoutBooking(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const booking = await BookingService.payoutBooking(body, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PAYMENT.PAYOUT_MARKED, { booking });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/refund
  async refundBooking(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const booking = await BookingService.refundBooking(body, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.REFUNDED, { booking });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/disputes
  async getDisputes(req) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const filter = {
        status: url.searchParams.get('status'),
        vendorId: url.searchParams.get('vendorId')
      };
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const result = await BookingService.getDisputes(filter, page, limit);
      return this.success(HTTP_STATUS.OK, "Customer disputes retrieved", result);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/dispute/resolve
  async resolveDispute(req, { params }) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const { decision, adminNotes } = body;
      const dispute = await BookingService.resolveDispute(req.user.id, params.id, decision, adminNotes, req);
      return this.success(HTTP_STATUS.OK, "Dispute resolution recorded", { dispute });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const bookingController = new BookingController();
export default bookingController;
