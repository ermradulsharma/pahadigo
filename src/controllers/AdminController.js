const AdminService = require('../services/AdminService');
const PackageService = require('../services/PackageService');
const BookingService = require('../services/BookingService');

class AdminController {

    // Helper to verify admin
    _isAdmin(req) {
        return req.user && req.user.role === 'admin';
    }

    // GET /admin/stats
    async getStats(req) {
        try {
            if (!this._isAdmin(req)) {
                return { status: 403, data: { error: 'Admin access required' } };
            }

            const stats = await AdminService.getDashboardStats();

            return { status: 200, data: stats };
        } catch (error) {
            console.error('Admin Stats Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // GET /admin/bookings
    async getBookings(req) {
        try {
            if (!this._isAdmin(req)) return { status: 403, data: { error: 'Forbidden' } };

            const bookings = await AdminService.getAllBookings();

            return { status: 200, data: { bookings } };
        } catch (error) {
            console.error('Admin Bookings Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // GET /admin/vendors
    async getVendors(req) {
        try {
            if (!this._isAdmin(req)) return { status: 403, data: { error: 'Forbidden' } };

            const vendors = await AdminService.getAllVendors();
            return { status: 200, data: { vendors } };
        } catch (error) {
            console.error('Admin Vendors Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // POST /admin/approve-vendor
    async approveVendor(req) {
        try {
            if (!this._isAdmin(req)) return { status: 403, data: { error: 'Forbidden' } };
            const body = await req.json();
            const { vendorId, status, rejectionReason } = body;

            if (!vendorId) return { status: 400, data: { error: 'Vendor ID required' } };

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

            const Vendor = require('../models/Vendor');
            await Vendor.findByIdAndUpdate(vendorId, updateData);

            return { status: 200, data: { message: `Vendor ${status || 'approved'}` } };
        } catch (error) {
            console.error('Approve Vendor Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // POST /admin/verify-document
    async verifyDocument(req) {
        try {
            if (!this._isAdmin(req)) return { status: 403, data: { error: 'Forbidden' } };
            const body = await req.json();
            const { vendorId, documentField, status, reason, index } = body;

            if (!vendorId || !documentField || !status) {
                return { status: 400, data: { error: 'Vendor ID, document field, and status are required' } };
            }

            const Vendor = require('../models/Vendor');
            const vendor = await Vendor.findById(vendorId);
            if (!vendor) return { status: 404, data: { error: 'Vendor not found' } };

            if (!vendor.documents || !vendor.documents[documentField]) {
                return { status: 404, data: { error: 'Document field not found' } };
            }

            // Handle array fields
            if (Array.isArray(vendor.documents[documentField])) {
                if (typeof index !== 'number') return { status: 400, data: { error: 'Index required for array fields' } };
                if (!vendor.documents[documentField][index]) return { status: 404, data: { error: 'Document at index not found' } };

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

            return { status: 200, data: { message: `Document ${documentField} updated to ${status}` } };
        } catch (error) {
            console.error('Verify Document Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // POST /admin/add-package
    async addPackageOnBehalf(req) {
        try {
            if (!this._isAdmin(req)) return { status: 403, data: { error: 'Forbidden' } };
            const body = await req.json();
            const { vendorId, ...pkgData } = body;

            if (!vendorId) return { status: 400, data: { error: 'Vendor ID required' } };

            const pkg = await PackageService.createPackage(vendorId, pkgData);
            return { status: 201, data: { message: 'Package created', pkg } };
        } catch (error) {
            console.error('Admin Add Package Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // POST /admin/payout
    async markPayout(req) {
        try {
            if (!this._isAdmin(req)) return { status: 403, data: { error: 'Forbidden' } };
            const body = await req.json();
            const { bookingId } = body;

            if (!bookingId) return { status: 400, data: { error: 'Booking ID required' } };

            await BookingService.markPayout(bookingId);

            return { status: 200, data: { message: 'Payout marked as paid' } };
        } catch (error) {
            console.error('Mark Payout Error:', error);
            const status = error.message === 'Booking not found' ? 404 : 500;
            return { status, data: { error: error.message } };
        }
    }

    // POST /admin/refund
    async refundBooking(req) {
        try {
            if (!this._isAdmin(req)) return { status: 403, data: { error: 'Forbidden' } };
            const body = await req.json();
            const { bookingId } = body;

            if (!bookingId) return { status: 400, data: { error: 'Booking ID required' } };

            await BookingService.processRefund(bookingId);

            return { status: 200, data: { message: 'Booking refunded successfully' } };
        } catch (error) {
            console.error('Refund Booking Error:', error);
            const status = error.message === 'Booking not found' ? 404 : 500;
            return { status, data: { error: error.message } };
        }
    }

    // GET /admin/payment-history
    async getPaymentHistory(req) {
        try {
            if (!this._isAdmin(req)) return { status: 403, data: { error: 'Forbidden' } };

            const history = await AdminService.getPaymentHistory();

            return { status: 200, data: { history } };
        } catch (error) {
            console.error('Payment History Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }
}

module.exports = new AdminController();
