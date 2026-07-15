import BookingService from '@/core/Services/Admin/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * BookingController (Admin Role)
 * Platform-wide reservation management, financial settlement, and disputes.
 */
class BookingController extends Controller {

  // GET /admin/bookings
  async getAllBookings(req) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const filter = { status: url.searchParams.get('status') || 'all' };
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      const result = await BookingService.getAllBookings(filter, page, limit);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/bookings/create
  async createBooking(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const booking = await BookingService.createBookingByAdmin(body, req);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { booking });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
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
      const booking = await BookingService.payoutBooking(req.payload, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PAYMENT.PAYOUT_MARKED, { booking });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/refund
  async refundBooking(req) {
    try {
      const booking = await BookingService.refundBooking(req.payload, req);
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
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.DISPUTE.FETCHED, result);
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
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.DISPUTE.RESOLVED, { dispute });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/bookings/:id/invoice
  async sendInvoice(req, { params }) {
    try {
      const booking = await BookingService.generateAndSendInvoice(params.id);
      return this.success(HTTP_STATUS.OK, "Audit: Invoice Pipeline Executed Successfully.", { booking });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const bookingController = new BookingController();
export default bookingController;
