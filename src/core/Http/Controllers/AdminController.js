import AdminService from '@/services/AdminService.js';
import PackageService from '@/services/PackageService.js';
import BookingService from '@/services/BookingService.js';
import Vendor from '@/models/Vendor.js';
import OCRService from '@/services/OCRService.js';
import VerifiedIdentity from '@/models/VerifiedIdentity.js';
import { errorResponse, successResponse } from '@/helpers/response.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

class AdminController {

    // GET /admin/stats
    async getStats(req) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                return errorResponse(HTTP_STATUS.FORBIDDEN, 'This action is restricted to administrators only', {});
            }

            const stats = await AdminService.getDashboardStats();

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.STATS_FETCHED, { stats });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /admin/bookings
    async getBookings(req) {
        try {

            const bookings = await AdminService.getAllBookings();

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.FETCHED || RESPONSE_MESSAGES.SUCCESS.FETCHED, { bookings });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /admin/vendors
    async getVendors(req) {
        try {
            const vendors = await AdminService.getAllVendors();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, { vendors });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /admin/travellers
    async getTravellers(req) {
        try {

            const travellers = await AdminService.getAllTravellers();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { travellers });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // POST /admin/travellers
    async createTraveller(req) {
        try {
            const body = req.jsonBody || await req.json();

            if (!body.name || !body.email || !body.password) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const traveller = await AdminService.createTraveller(body, req);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { traveller });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // POST /admin/approve-vendor
    async approveVendor(req) {
        try {
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

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.STATUS_UPDATED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // PATCH /admin/vendors/:id
    async updateVendor(req, { params }) {
        try {
            const { id } = params;
            const body = req.jsonBody || await req.json();

            if (!id) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            const vendor = await AdminService.updateVendor(id, body, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.UPDATED, { vendor });
        } catch (error) {
            console.error("AdminController.updateVendor Error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, { debugObj: error.message });
        }
    }

    // POST /admin/trigger-ocr
    async verifyDocumentOCR(req) {
        try {
            const body = req.jsonBody || await req.json();
            const { vendorId, documentField, index } = body;

            if (!vendorId || !documentField) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const vendor = await Vendor.findById(vendorId);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

            let doc = null;
            if (Array.isArray(vendor.documents[documentField])) {
                if (typeof index !== 'number') return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.INDEX_REQUIRED, {});
                doc = vendor.documents[documentField][index];
            } else {
                doc = vendor.documents[documentField];
            }

            if (!doc || !doc.url) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND, {});

            // 1. Fetch Image
            // Optimize URL for OCR: Force JPEG and auto-quality to ensure compatibility
            const docUrl = new URL(doc.url);
            if (docUrl.hostname !== 'res.cloudinary.com') {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid Document Host. SSRF blocked.", {});
            }

            const optimizedUrl = doc.url.includes('cloudinary')
                ? doc.url.replace('/upload/', '/upload/f_jpg,q_auto/')
                : doc.url;

            const imgRes = await fetch(optimizedUrl);

            if (!imgRes.ok) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, `Failed to fetch document image (Status: ${imgRes.status})`, {});
            }

            const buffer = Buffer.from(await imgRes.arrayBuffer());


            if (buffer.length < 100) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.INVALID_IMAGE, {});
            }

            // 2. Run OCR

            const ocrResult = await OCRService.processDocument(buffer);


            if (ocrResult.error) {
                return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
            }



            // 3. Save to VerifiedIdentity table
            const identityData = {
                vendor: vendorId,
                docType: ocrResult.idType,
                idNumber: ocrResult.identifiedId || "UNKNOWN",
                name: ocrResult.name,
                dateOfBirth: ocrResult.dob,
                rawOcrText: ocrResult.text
            };

            // Use upsert to avoid duplicates if re-run
            await VerifiedIdentity.findOneAndUpdate(
                { vendor: vendorId, docType: ocrResult.idType },
                identityData,
                { upsert: true, returnDocument: 'after' }
            );

            // 4. Update Document Status & OCR cache in Vendor model
            if (Array.isArray(vendor.documents[documentField])) {
                vendor.documents[documentField][index].status = 'verified';
                vendor.documents[documentField][index].ocrData = {
                    identifiedId: ocrResult.identifiedId,
                    text: ocrResult.text
                };
            } else {
                vendor.documents[documentField].status = 'verified';
                vendor.documents[documentField].ocrData = {
                    identifiedId: ocrResult.identifiedId,
                    text: ocrResult.text
                };
            }

            vendor.markModified('documents');
            vendor.isApproved = true; // Auto-approve vendor on successful OCR
            await vendor.save();

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.OCR_SUCCESS, { identity: identityData });

        } catch (error) {
            console.error("Admin OCR Error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // POST /admin/verify-document
    async verifyDocument(req) {
        try {
            const body = req.jsonBody || await req.json();
            const { vendorId, documentField, status, reason, index } = body;

            if (!vendorId || !documentField || !status) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const vendor = await Vendor.findById(vendorId);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

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

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.DOCUMENT_STATUS_UPDATED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // POST /admin/add-package
    async addPackageOnBehalf(req) {
        try {
            const body = req.jsonBody || await req.json();
            const { vendorId, ...pkgData } = body;

            if (!vendorId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            const pkg = await PackageService.createPackage(vendorId, pkgData);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.PACKAGE.CREATED, { pkg });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // POST /admin/payout
    async markPayout(req) {
        try {
            const body = req.jsonBody || await req.json();
            const { bookingId } = body;

            if (!bookingId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            await BookingService.markPayout(bookingId, req);

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.PAYMENT.PAYOUT_MARKED, {});
        } catch (error) {
            const status = error.message === 'Booking not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const msg = error.message === 'Booking not found' ? RESPONSE_MESSAGES.BOOKING.NOT_FOUND : RESPONSE_MESSAGES.ERROR.SERVER_ERROR;
            return errorResponse(status, msg, {});
        }
    }

    // POST /admin/refund
    async refundBooking(req) {
        try {
            const body = req.jsonBody || await req.json();
            const { bookingId } = body;

            if (!bookingId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            await BookingService.processRefund(bookingId, req);

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.BOOKING.REFUNDED, {});
        } catch (error) {
            const status = error.message === 'Booking not found' ? HTTP_STATUS.NOT_FOUND : HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const msg = error.message === 'Booking not found' ? RESPONSE_MESSAGES.BOOKING.NOT_FOUND : RESPONSE_MESSAGES.ERROR.SERVER_ERROR;
            return errorResponse(status, msg, {});
        }
    }

    // GET /admin/payment-history
    async getPaymentHistory(req) {
        try {

            const history = await AdminService.getPaymentHistory();

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.PAYMENT_HISTORY_FETCHED, { history });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /admin/packages
    async getPackages(req) {
        try {
            const packages = await AdminService.getAllServices();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.PACKAGE.FETCHED, { packages });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // PATCH /admin/packages
    async updateServiceStatus(req) {
        try {
            const body = req.jsonBody || await req.json();
            const { vendorId, serviceType, serviceId, status } = body;

            if (!vendorId || !serviceType || !serviceId || status === undefined) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const updated = await AdminService.toggleServiceStatus(vendorId, serviceType, serviceId, status);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.SERVICE_STATUS_UPDATED || "Status updated", { updated });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // GET /admin/reviews
    async getReviews(req) {
        try {

            const reviews = await AdminService.getAllReviews();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { reviews });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // PATCH /admin/reviews
    async updateReviewStatus(req) {
        try {
            const body = req.jsonBody || await req.json();
            const { reviewId, isVisible } = body;

            if (!reviewId || isVisible === undefined) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const updated = await AdminService.toggleReviewVisibility(reviewId, isVisible, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { updated });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // DELETE /admin/reviews
    async deleteReview(req, { params }) {
        try {
            const { id } = params;

            if (!id) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED, {});

            await AdminService.deleteReview(id, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
        }
    }

    // --- Marketing ---

    // Banners
    async createBanner(req) {
        try {
            const body = req.jsonBody || await req.json();
            if (!body.imageUrl) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            const banner = await AdminService.createBanner(body, req);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { banner });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    async getBanners(req) {
        try {
            const banners = await AdminService.getBanners();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.BANNERS_FETCHED, { banners });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    async updateBanner(req, { params }) {
        try {
            const body = req.jsonBody || await req.json();
            const banner = await AdminService.updateBanner(params.id, body, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { banner });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    async deleteBanner(req, { params }) {
        try {
            await AdminService.deleteBanner(params.id, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, {});
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    // Coupons
    async createCoupon(req) {
        try {
            const body = req.jsonBody || await req.json();
            if (!body.code || !body.discountType || !body.value || !body.expiryDate) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }
            const coupon = await AdminService.createCoupon(body, req);
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { coupon });
        } catch (e) {
            const status = e.code === 11000 ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;
            const msg = e.code === 11000 ? RESPONSE_MESSAGES.ERROR.ALREADY_EXISTS : RESPONSE_MESSAGES.ERROR.SERVER_ERROR;
            return errorResponse(status, msg, {});
        }
    }

    async getCoupons(req) {
        try {
            const coupons = await AdminService.getCoupons();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.COUPONS_FETCHED, { coupons });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    async updateCoupon(req, { params }) {
        try {
            const body = req.jsonBody || await req.json();
            const coupon = await AdminService.updateCoupon(params.id, body, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { coupon });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    async deleteCoupon(req, { params }) {
        try {
            await AdminService.deleteCoupon(params.id, req);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, {});
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
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
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.INQUIRY.SUBMITTED, { inquiry });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    async getInquiries(req) {
        try {
            const inquiries = await AdminService.getInquiries();
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.INQUIRIES_FETCHED, { inquiries });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    async updateInquiry(req, { params }) {
        try {
            const body = req.jsonBody || await req.json();
            const inquiry = await AdminService.updateInquiry(params.id, body);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { inquiry });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    async deleteInquiry(req, { params }) {
        try {
            await AdminService.deleteInquiry(params.id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, {});
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    // --- Analytics ---

    async getAnalytics(req) {
        try {

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

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { analytics: data });
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }

    // --- Audit Logs ---

    async getAuditLogs(req) {
        try {

            const url = new URL(req.url);
            const adminId = url.searchParams.get('adminId');
            const action = url.searchParams.get('action');
            const target = url.searchParams.get('target');
            const startDate = url.searchParams.get('startDate');
            const page = parseInt(url.searchParams.get('page') || '1');
            const limit = parseInt(url.searchParams.get('limit') || '20');

            const result = await AdminService.getAuditLogs({ adminId, action, target, startDate }, page, limit);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.AUDIT_LOGS_FETCHED, result);
        } catch (e) { return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {}); }
    }
}

const adminController = new AdminController();
export default adminController;