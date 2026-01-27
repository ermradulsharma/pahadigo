import AdminService from '../services/AdminService.js';
import PackageService from '../services/PackageService.js';
import BookingService from '../services/BookingService.js';
import Vendor from '../models/Vendor.js';
import { errorResponse, successResponse } from '../helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/index.js';

class AdminController {

    // Helper to verify admin
    _isAdmin(req) {
        return req.user && req.user.role === 'admin';
    }

    // GET /admin/stats
    async getStats(req) {
        try {
            if (!this._isAdmin(req)) {
                return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.ADMIN_ONLY, {});
            }

            const stats = await AdminService.getDashboardStats();

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { stats });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /admin/bookings
    async getBookings(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const bookings = await AdminService.getAllBookings();

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { bookings });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /admin/vendors
    async getVendors(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const vendors = await AdminService.getAllVendors();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { vendors });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /admin/travellers
    async getTravellers(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const travellers = await AdminService.getAllTravellers();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { travellers });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /admin/approve-vendor
    async approveVendor(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const { vendorId, status, rejectionReason } = body;

            if (!vendorId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            // status: 'verified' | 'rejected'
            // If status is not provided, fallback to old behavior (simple approval -> verified)

            const updateData = {};
            if (status === 'verified') {
                updateData.isApproved = true;
            } else if (status === 'rejected') {
                updateData.isApproved = false;
            } else {
                // Default legacy behavior: just approve
                updateData.isApproved = true;
            }

            await Vendor.findByIdAndUpdate(vendorId, updateData);

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.VENDOR_STATUS_UPDATED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /admin/verify-document
    async verifyDocument(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const { vendorId, documentField, status, reason, index } = body;

            if (!vendorId || !documentField || !status) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const vendor = await Vendor.findById(vendorId);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            if (!vendor.documents || !vendor.documents[documentField]) {
                return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND, {});
            }

            // Handle array fields
            if (Array.isArray(vendor.documents[documentField])) {
                if (typeof index !== 'number') return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
                if (!vendor.documents[documentField][index]) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND, {});

                vendor.documents[documentField][index].status = status;
                vendor.documents[documentField][index].reason = status === 'rejected' ? reason : null;
            } else {
                // Single object field
                vendor.documents[documentField].status = status;
                vendor.documents[documentField].reason = status === 'rejected' ? reason : null;
            }

            // Mark modified because we are mutating sub-documents/properties
            vendor.markModified('documents');
            await vendor.save();

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DOCUMENT_STATUS_UPDATED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /admin/add-package
    async addPackageOnBehalf(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const { vendorId, ...pkgData } = body;

            if (!vendorId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            const pkg = await PackageService.createPackage(vendorId, pkgData);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.PACKAGE_CREATED, { pkg });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /admin/payout
    async markPayout(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const { bookingId } = body;

            if (!bookingId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            await BookingService.markPayout(bookingId);

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.PAYOUT_MARKED, {});
        } catch (error) {
            const status = error.message === 'Booking not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
            return errorResponse(status, error.message, {});
        }
    }

    // POST /admin/refund
    async refundBooking(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const { bookingId } = body;

            if (!bookingId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            await BookingService.processRefund(bookingId);

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.BOOKING_REFUNDED, {});
        } catch (error) {
            const status = error.message === 'Booking not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
            return errorResponse(status, error.message, {});
        }
    }

    // GET /admin/payment-history
    async getPaymentHistory(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const history = await AdminService.getPaymentHistory();

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { history });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }
}

const adminController = new AdminController();
export default adminController;
