import DashboardController from '@/core/Controllers/Admin/DashboardController.js';
import TravellerController from '@/core/Controllers/Admin/TravellerController.js';
import VendorController from '@/core/Controllers/Admin/VendorController.js';
import PackageController from '@/core/Controllers/Admin/PackageController.js';
import CategoryController from '@/core/Controllers/Admin/CategoryController.js';
import CategoryDocumentController from '@/core/Controllers/Admin/CategoryDocumentController.js';
import BookingController from '@/core/Controllers/Admin/BookingController.js';
import PaymentController from '@/core/Controllers/Admin/PaymentController.js';
import MarketingController from '@/core/Controllers/Admin/MarketingController.js';
import ReviewController from '@/core/Controllers/Admin/ReviewController.js';
import DisputeController from '@/core/Controllers/Admin/DisputeController.js';
import InquiryController from '@/core/Controllers/Admin/InquiryController.js';
import SettingsController from '@/core/Controllers/Admin/SettingsController.js';
import LocationController from '@/core/Controllers/Admin/LocationController.js';
import PolicyController from '@/core/Controllers/Admin/PolicyController.js';
import AuthController from '@/core/Controllers/Auth/AuthController.js';

import Router from '@/core/Routes/Router.js';
import { USER_ROLES } from '@/core/Constants/index.js';
import { wrap } from '@/core/Routes/helpers.js';

/**
 * Admin Routes - Full Enterprise Governance Hub.
 * Porto-Nested and Separated strictly from the legacy api.js manifest.
 */
const adminRoutes = [
  ...Router.group({ prefix: '/admin', middleware: ['auth'], roles: [USER_ROLES.ADMIN] }, [

    // Dashboard & Analytics (Matches Line 233-238)
    { method: 'GET', path: '/stats', handler: wrap(() => DashboardController, 'getStats') },
    { method: 'GET', path: '/analytics', handler: wrap(() => DashboardController, 'getAnalytics') },
    { method: 'GET', path: '/audit-logs', handler: wrap(() => DashboardController, 'getAuditLogs') },
    { method: 'POST', path: '/change-password', handler: wrap(() => AuthController, 'changePassword') },
    { method: 'POST', path: '/reset-password', handler: wrap(() => AuthController, 'resetPassword') },

    // User Management: Travellers (Matches Line 241-246)
    ...Router.group({ prefix: '/travellers' }, [
      { method: 'GET', path: '/', handler: wrap(() => TravellerController, 'getTravellers') },
      { method: 'POST', path: '/create', handler: wrap(() => TravellerController, 'createTraveller') },
      { method: 'PATCH', path: '/:id/update', handler: wrap(() => TravellerController, 'updateTraveller') },
      { method: 'DELETE', path: '/:id/delete', handler: wrap(() => TravellerController, 'deleteTraveller') },
    ]),

    // User Management: Vendors (Matches Line 249-257)
    ...Router.group({ prefix: '/vendors' }, [
      { method: 'GET', path: '/', handler: wrap(() => VendorController, 'getVendors') },
      { method: 'GET', path: '/:id', handler: wrap(() => VendorController, 'getVendorById') },
      { method: 'GET', path: '/:id/packages', handler: wrap(() => VendorController, 'getVendorPackages') },
      { method: 'POST', path: '/create', handler: wrap(() => VendorController, 'createVendor') },
      { method: 'PATCH', path: '/:id/update', handler: wrap(() => VendorController, 'updateVendor') },
      { method: 'DELETE', path: '/:id/delete', handler: wrap(() => VendorController, 'deleteVendor') },
    ]),
    { method: 'POST', path: '/approve-vendor', handler: wrap(() => VendorController, 'approveVendor') },

    // Trust & Compliance (Matches Line 258-262)
    { method: 'POST', path: '/verify-document', handler: wrap(() => VendorController, 'verifyDocument') },
    { method: 'POST', path: '/verify-category-document', handler: wrap(() => VendorController, 'verifyCategoryDocument') },
    { method: 'POST', path: '/trigger-ocr', handler: wrap(() => VendorController, 'verifyDocumentOCR') },

    // Inventory Hub (Matches Line 265-271)
    ...Router.group({ prefix: '/packages' }, [
      { method: 'GET', path: '/', handler: wrap(() => PackageController, 'getPackages') },
      { method: 'PATCH', path: '/:id/status', handler: wrap(() => PackageController, 'updateServiceStatus') },
      { method: 'POST', path: '/add', handler: wrap(() => PackageController, 'addPackageOnBehalf') },
      { method: 'GET', path: '/item/:id', handler: wrap(() => PackageController, 'getPackageItem') },
      { method: 'PATCH', path: '/item/:id', handler: wrap(() => PackageController, 'updatePackageItem') },
    ]),

    // Operations Hub (Matches Line 274-277)
    ...Router.group({ prefix: '/bookings' }, [
      { method: 'GET', path: '/', handler: wrap(() => BookingController, 'getAllBookings') },
      { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'show') },
      { method: 'POST', path: '/:id/invoice', handler: wrap(() => BookingController, 'sendInvoice') },
    ]),
    ...Router.group({ prefix: '/payments' }, [
      { method: 'GET', path: '/', handler: wrap(() => PaymentController, 'getPaymentHistory') },
      { method: 'POST', path: '/payout', handler: wrap(() => PaymentController, 'payoutBooking') },
      { method: 'POST', path: '/refund', handler: wrap(() => PaymentController, 'refundBooking') },
    ]),

    // Moderation & Social (Matches Line 280-284)
    ...Router.group({ prefix: '/reviews' }, [
      { method: 'GET', path: '/', handler: wrap(() => ReviewController, 'getPendingReviews') },
      { method: 'PATCH', path: '/:id', handler: wrap(() => ReviewController, 'updateReviewStatus') },
      { method: 'DELETE', path: '/:id', handler: wrap(() => ReviewController, 'rejectReview') },
    ]),

    ...Router.group({ prefix: '/disputes' }, [
      { method: 'GET', path: '/', handler: wrap(() => DisputeController, 'getDisputes') },
      { method: 'PATCH', path: '/:id', handler: wrap(() => DisputeController, 'resolveDispute') },
    ]),

    ...Router.group({ prefix: '/inquiries' }, [
      { method: 'GET', path: '/', handler: wrap(() => InquiryController, 'getInquiries') },
      { method: 'PATCH', path: '/:id', handler: wrap(() => InquiryController, 'updateInquiry') },
      { method: 'DELETE', path: '/:id', handler: wrap(() => InquiryController, 'deleteInquiry') },
    ]),

    // Marketing Hub (Matches Line 291-304)
    ...Router.group({ prefix: '/marketing' }, [

      ...Router.group({ prefix: '/banners' }, [
        { method: 'GET', path: '/', handler: wrap(() => MarketingController, 'getBanners') },
        { method: 'POST', path: '/', handler: wrap(() => MarketingController, 'addBanner') },
        { method: 'PUT', path: '/:id', handler: wrap(() => MarketingController, 'updateBanner') },
        { method: 'DELETE', path: '/:id', handler: wrap(() => MarketingController, 'deleteBanner') },
      ]),

      ...Router.group({ prefix: '/coupons' }, [
        { method: 'GET', path: '/', handler: wrap(() => MarketingController, 'getCoupons') },
        { method: 'POST', path: '/', handler: wrap(() => MarketingController, 'createCoupon') },
        { method: 'PUT', path: '/:id', handler: wrap(() => MarketingController, 'updateCoupon') },
        { method: 'DELETE', path: '/:id', handler: wrap(() => MarketingController, 'deleteCoupon') },
      ]),
    ]),

    // Taxonomy Hub (Matches Line 307-319)
    ...Router.group({ prefix: '/categories' }, [
      { method: 'POST', path: '/', handler: wrap(() => CategoryController, 'create') },
      { method: 'PUT', path: '/:id', handler: wrap(() => CategoryController, 'update') },
      { method: 'DELETE', path: '/:id', handler: wrap(() => CategoryController, 'delete') },
      { method: 'POST', path: '/seed', handler: wrap(() => CategoryController, 'seed') },
    ]),

    ...Router.group({ prefix: '/category-documents' }, [
      { method: 'GET', path: '/', handler: wrap(() => CategoryDocumentController, 'getAll') },
      { method: 'POST', path: '/', handler: wrap(() => CategoryDocumentController, 'create') },
      { method: 'GET', path: '/:id', handler: wrap(() => CategoryDocumentController, 'getById') },
      { method: 'PUT', path: '/:id', handler: wrap(() => CategoryDocumentController, 'update') },
      { method: 'DELETE', path: '/:id', handler: wrap(() => CategoryDocumentController, 'delete') },
    ]),

    // System Configuration Hub (Matches Line 321-331)
    ...Router.group({ prefix: '/settings' }, [
      { method: 'GET', path: '/', handler: wrap(() => SettingsController, 'getSettings') },
      { method: 'POST', path: '/', handler: wrap(() => SettingsController, 'updateSettings') },
    ]),

    ...Router.group({ prefix: '/policies' }, [
      { method: 'GET', path: '/', handler: wrap(() => PolicyController, 'getPolicies') },
      { method: 'POST', path: '/', handler: wrap(() => PolicyController, 'savePolicy') },
      { method: 'POST', path: '/seed', handler: wrap(() => PolicyController, 'seed') },
    ]),

    // Geography (Matches Line 333-334)
    { method: 'POST', path: '/countries', handler: wrap(() => LocationController, 'createCountry') },
    { method: 'POST', path: '/states', handler: wrap(() => LocationController, 'createState') },
  ]),
];

export default adminRoutes;
