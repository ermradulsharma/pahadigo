import AdminService from '../services/AdminService.js';
import PackageService from '../services/PackageService.js';
import BookingService from '../services/BookingService.js';
import Vendor from '../models/Vendor.js';
import { errorResponse, successResponse } from '../helpers/response.js';

class AdminController {

    // Helper to verify admin
    _isAdmin(req) {
        return req.user && req.user.role === 'admin';
    }

    // GET /admin/stats
    async getStats(req) {
        try {
            if (!this._isAdmin(req)) {
                return errorResponse(403, 'Admin access required', {});
            }

            const stats = await AdminService.getDashboardStats();

            return successResponse(200, 'Stats retrieved successfully', { stats });
        } catch (error) {
            console.error('Admin Stats Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /admin/bookings
    async getBookings(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(403, 'Forbidden', {});

            const bookings = await AdminService.getAllBookings();

            return successResponse(200, 'Bookings retrieved successfully', { bookings });
        } catch (error) {
            console.error('Admin Bookings Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /admin/vendors
    async getVendors(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(403, 'Forbidden', {});

            const vendors = await AdminService.getAllVendors();
            return successResponse(200, 'Vendors retrieved successfully', { vendors });
        } catch (error) {
            console.error('Admin Vendors Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /admin/travellers
    async getTravellers(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(403, 'Forbidden', {});

            const travellers = await AdminService.getAllTravellers();
            return successResponse(200, 'Travellers retrieved successfully', { travellers });
        } catch (error) {
            console.error('Admin Travellers Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /admin/approve-vendor
    async approveVendor(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(403, 'Forbidden', {});
            const body = await req.json();
            const { vendorId, status, rejectionReason } = body;

            if (!vendorId) return errorResponse(400, 'Vendor ID required', {});

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

            return successResponse(200, `Vendor ${status || 'approved'}`, {});
        } catch (error) {
            console.error('Approve Vendor Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /admin/verify-document
    async verifyDocument(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(403, 'Forbidden', {});
            const body = await req.json();
            const { vendorId, documentField, status, reason, index } = body;

            if (!vendorId || !documentField || !status) {
                return errorResponse(400, 'Vendor ID, document field, and status are required', {});
            }

            const vendor = await Vendor.findById(vendorId);
            if (!vendor) return errorResponse(404, 'Vendor not found', {});

            if (!vendor.documents || !vendor.documents[documentField]) {
                return errorResponse(404, 'Document field not found', {});
            }

            // Handle array fields
            if (Array.isArray(vendor.documents[documentField])) {
                if (typeof index !== 'number') return errorResponse(400, 'Index required for array fields', {});
                if (!vendor.documents[documentField][index]) return errorResponse(404, 'Document at index not found', {});

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

            return successResponse(200, `Document ${documentField} updated to ${status}`, {});
        } catch (error) {
            console.error('Verify Document Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /admin/add-package
    async addPackageOnBehalf(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(403, 'Forbidden', {});
            const body = await req.json();
            const { vendorId, ...pkgData } = body;

            if (!vendorId) return errorResponse(400, 'Vendor ID required', {});

            const pkg = await PackageService.createPackage(vendorId, pkgData);
            return successResponse(201, 'Package created', { pkg });
        } catch (error) {
            console.error('Admin Add Package Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /admin/payout
    async markPayout(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(403, 'Forbidden', {});
            const body = await req.json();
            const { bookingId } = body;

            if (!bookingId) return errorResponse(400, 'Booking ID required', {});

            await BookingService.markPayout(bookingId);

            return successResponse(200, 'Payout marked as paid', {});
        } catch (error) {
            console.error('Mark Payout Error:', error);
            const status = error.message === 'Booking not found' ? 404 : 500;
            return errorResponse(status, error.message, {});
        }
    }

    // POST /admin/refund
    async refundBooking(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(403, 'Forbidden', {});
            const body = await req.json();
            const { bookingId } = body;

            if (!bookingId) return errorResponse(400, 'Booking ID required', {});

            await BookingService.processRefund(bookingId);

            return successResponse(200, 'Booking refunded successfully', {});
        } catch (error) {
            console.error('Refund Booking Error:', error);
            const status = error.message === 'Booking not found' ? 404 : 500;
            return errorResponse(status, error.message, {});
        }
    }

    // GET /admin/payment-history
    async getPaymentHistory(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(403, 'Forbidden', {});

            const history = await AdminService.getPaymentHistory();

            return successResponse(200, 'Payment history retrieved successfully', { history });
        } catch (error) {
            console.error('Payment History Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }
}

const adminController = new AdminController();
export default adminController;
