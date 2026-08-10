import BookingService from '@/core/Services/Admin/BookingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import InvoiceDocument from '@/core/Templates/Pdf/InvoiceDocument.jsx';
import { validate, schemas } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

/**
 * BookingController (Admin Role)
 * Platform-wide reservation management, financial settlement, and disputes.
 */
class BookingController extends Controller {

    // GET /admin/bookings
    async getAllBookings(req) {
        try {
            const url = new URL(req.url);
            const filter = { status: url.searchParams.get('status') || 'all' };
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '10');

            const result = await BookingService.getAllBookings(filter, page, limit);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED, result);
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /admin/bookings/create
    async createBooking(req) {
        try {
            const validation = validate(schemas.adminBookingMutation, req.payload || {});
            if (!validation.success) throw new AppError(validation.error, HTTP_STATUS.BAD_REQUEST);

            const booking = await BookingService.createBookingByAdmin(validation.data, req);
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { booking });
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /admin/bookings/:id
    async show(req, { params }) {
        try {
            const booking = await BookingService.getBookingById(params.id);
            if (!booking) throw new AppError(RESPONSE_MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED, { booking });
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /admin/payout
    async payoutBooking(req) {
        try {
            const validation = validate(schemas.adminPayout, req.payload || {});
            if (!validation.success) throw new AppError(validation.error, HTTP_STATUS.BAD_REQUEST);

            const booking = await BookingService.payoutBooking(validation.data, req);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.PAYMENT.PAYOUT_MARKED, { booking });
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /admin/refund
    async refundBooking(req) {
        try {
            const validation = validate(schemas.adminRefund, req.payload || {});
            if (!validation.success) throw new AppError(validation.error, HTTP_STATUS.BAD_REQUEST);

            const booking = await BookingService.refundBooking(validation.data, req);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.REFUNDED, { booking });
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /admin/disputes
    async getDisputes(req) {
        try {
            const url = new URL(req.url);
            const filter = {
                status: url.searchParams.get('status'),
                vendorId: url.searchParams.get('vendorId')
            };
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');

            const result = await BookingService.getDisputes(filter, page, limit);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.DISPUTE.FETCHED, result);
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /admin/dispute/resolve
    async resolveDispute(req, { params }) {
        try {
            const validation = validate(schemas.disputeResolution, req.payload || {});
            if (!validation.success) throw new AppError(validation.error, HTTP_STATUS.BAD_REQUEST);

            const { decision, adminNotes } = validation.data;
            const dispute = await BookingService.resolveDispute(req.user.id, params.id, decision, adminNotes, req);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.DISPUTE.RESOLVED, { dispute });
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // POST /admin/bookings/:id/invoice
    async sendInvoice(req, { params }) {
        try {
            const booking = await BookingService.generateAndSendInvoice(params.id);
            return this.success(HTTP_STATUS.OK, "Audit: Invoice Pipeline Executed Successfully.", { booking });
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }

    // GET /admin/bookings/:id/download-invoice
    async downloadInvoice(req, { params }) {
        try {
            const booking = await BookingService.getBookingById(params.id);
            if (!booking) throw new AppError(RESPONSE_MESSAGES.BOOKING.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
            const url = new URL(req.url, baseUrl);
            const role = url.searchParams.get('type') || 'traveller';

            const stream = await renderToStream(React.createElement(InvoiceDocument, { booking, role }));

            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const pdfBuffer = Buffer.concat(chunks);

            return new Response(pdfBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="Invoice_${booking.bookingCode}.pdf"`
                }
            });
        } catch (error) {
            if (error instanceof AppError) return this.error(error.statusCode, error.message);
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
        }
    }
}

const bookingController = new BookingController();
export default bookingController;

