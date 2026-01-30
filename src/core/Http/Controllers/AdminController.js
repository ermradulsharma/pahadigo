import AdminService from '@/services/AdminService.js';
import PackageService from '@/services/PackageService.js';
import BookingService from '@/services/BookingService.js';
import Vendor from '@/models/Vendor.js';
import { errorResponse, successResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

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

    // POST /admin/travellers
    async createTraveller(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();

            if (!body.name || !body.email || !body.password) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const traveller = await AdminService.createTraveller(body, req);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATE, { traveller });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
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

    // GET /admin/packages
    async getPackages(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const packages = await AdminService.getAllServices();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { packages });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // PATCH /admin/packages
    async updateServiceStatus(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const { vendorId, serviceType, serviceId, status } = body;

            if (!vendorId || !serviceType || !serviceId || status === undefined) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const updated = await AdminService.toggleServiceStatus(vendorId, serviceType, serviceId, status);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SERVICE_STATUS_UPDATED || "Status updated", { updated });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /admin/reviews
    async getReviews(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const reviews = await AdminService.getAllReviews();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { reviews });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // PATCH /admin/reviews
    async updateReviewStatus(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const { reviewId, isVisible } = body;

            if (!reviewId || isVisible === undefined) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const updated = await AdminService.toggleReviewVisibility(reviewId, isVisible, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, { updated });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // DELETE /admin/reviews
    async deleteReview(req, { params }) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const { id } = params;

            if (!id) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            await AdminService.deleteReview(id, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // --- Marketing ---

    // Banners
    async createBanner(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            if (!body.imageUrl) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            const banner = await AdminService.createBanner(body, req);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATE, { banner });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    async getBanners(req) {
        try {
            const banners = await AdminService.getBanners();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { banners });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    async updateBanner(req, { params }) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const banner = await AdminService.updateBanner(params.id, body, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, { banner });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    async deleteBanner(req, { params }) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            await AdminService.deleteBanner(params.id, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, {});
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    // Coupons
    async createCoupon(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            if (!body.code || !body.discountType || !body.value || !body.expiryDate) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }
            const coupon = await AdminService.createCoupon(body, req);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATE, { coupon });
        } catch (e) {
            const status = e.code === 11000 ? HTTP_STATUS.ALREADY_EXIST : HTTP_STATUS.INTERNAL_SERVER_ERROR;
            return errorResponse(status, e.message, {});
        }
    }

    async getCoupons(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const coupons = await AdminService.getCoupons();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { coupons });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    async updateCoupon(req, { params }) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const coupon = await AdminService.updateCoupon(params.id, body, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, { coupon });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    async deleteCoupon(req, { params }) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            await AdminService.deleteCoupon(params.id, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, {});
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    // --- Support & Inquiries ---

    // Public or Authenticated (User)
    async submitInquiry(req) {
        try {
            const body = req.jsonBody || await req.json();
            if (!body.name || !body.email || !body.message) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }
            const inquiry = await AdminService.submitInquiry(body);
            return successResponse(HTTP_STATUS.CREATED, "Inquiry submitted successfully", { inquiry });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    async getInquiries(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const inquiries = await AdminService.getInquiries();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { inquiries });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    async updateInquiry(req, { params }) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            const body = req.jsonBody || await req.json();
            const inquiry = await AdminService.updateInquiry(params.id, body);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, { inquiry });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    async deleteInquiry(req, { params }) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});
            await AdminService.deleteInquiry(params.id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, {});
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    // --- Analytics ---

    async getAnalytics(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            // Extract query params from URL
            const url = new URL(req.url);
            const period = url.searchParams.get('period') || 'monthly'; // weekly, monthly, yearly
            const type = url.searchParams.get('type'); // map, calendar, search, financial, health

            let data;

            if (type === 'map') {
                data = await AdminService.getMapAnalyticsData();
            } else if (type === 'calendar') {
                const start = url.searchParams.get('start');
                const end = url.searchParams.get('end');
                data = await AdminService.getCalendarEvents(start, end);
            } else if (type === 'search') {
                data = await AdminService.getSearchAnalytics();
            } else if (type === 'financial') {
                data = await AdminService.getFinancialStats();
            } else if (type === 'health') {
                data = await AdminService.getSystemHealth();
            } else {
                // Default legacy or overview
                data = await AdminService.getAnalyticsData(period);
            }

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { analytics: data });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }

    // --- Audit Logs ---

    async getAuditLogs(req) {
        try {
            if (!this._isAdmin(req)) return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.FORBIDDEN, {});

            const url = new URL(req.url);
            const adminId = url.searchParams.get('adminId');
            const action = url.searchParams.get('action');
            const target = url.searchParams.get('target');
            const startDate = url.searchParams.get('startDate');
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');

            const result = await AdminService.getAuditLogs({ adminId, action, target, startDate }, page, limit);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, result);
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, e.message, {}); }
    }
}

const adminController = new AdminController();
export default adminController;