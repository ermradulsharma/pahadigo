import VendorController from '@/controllers/VendorController.js';
import UserController from '@/controllers/UserController.js';
import AdminController from '@/controllers/AdminController.js';
import PolicyController from '@/controllers/PolicyController.js';
import PaymentController from '@/controllers/PaymentController.js';
import AuthController from '@/controllers/AuthController.js';
import CategoryController from '@/controllers/CategoryController.js';
import LocationController from '@/controllers/LocationController.js';
import { apiHandler } from '@/helpers/apiHandler.js';
import Router from './Router.js';

// Helper to wrap controller methods
const wrap = (method) => apiHandler(method);

// Define routes with method, path, handler, and optional middleware
const routes = [

    // Consolidated Auth (Email/Phone OTP & Google)
    ...Router.group({ prefix: '/auth' }, [
        { method: 'GET', path: '/me', handler: wrap(AuthController.me.bind(AuthController)), middleware: ['auth'] },
        { method: 'GET', path: '/verify', handler: wrap(AuthController.verify.bind(AuthController)) },
        { method: 'GET', path: '/refresh', handler: wrap(AuthController.refresh.bind(AuthController)) },
        { method: 'POST', path: '/otp', handler: wrap(AuthController.sendOtp.bind(AuthController)) },
        { method: 'POST', path: '/login', handler: wrap(AuthController.login.bind(AuthController)) },
        { method: 'POST', path: '/verify', handler: wrap(AuthController.verifyOtp.bind(AuthController)) },
        { method: 'POST', path: '/google', handler: wrap(AuthController.googleLogin.bind(AuthController)) },
        { method: 'POST', path: '/facebook', handler: wrap(AuthController.facebookLogin.bind(AuthController)) },
        { method: 'POST', path: '/apple', handler: wrap(AuthController.appleLogin.bind(AuthController)) },
        { method: 'POST', path: '/logout', handler: wrap(AuthController.logout.bind(AuthController)) },
        { method: 'POST', path: '/logout-all', handler: wrap(AuthController.logoutAll.bind(AuthController)) },
        { method: 'POST', path: '/forget-password', handler: wrap(AuthController.forgetPassword.bind(AuthController)) },
        { method: 'POST', path: '/reset-password', handler: wrap(AuthController.resetPassword.bind(AuthController)) },
        { method: 'POST', path: '/change-password', handler: wrap(AuthController.changePassword.bind(AuthController)) },
        { method: 'POST', path: '/update-profile', handler: wrap(AuthController.updateProfile.bind(AuthController)), middleware: ['auth'] },
        { method: 'POST', path: '/delete-profile', handler: wrap(AuthController.deleteProfile.bind(AuthController)) },
    ]),

    // Vendor
    ...Router.group({ prefix: '/vendor' }, [
        // Vendor Business
        ...Router.group({ prefix: '/business' }, [
            ...Router.group({ prefix: '/profile' }, [
                { method: 'GET', path: '/', handler: wrap(VendorController.getBusinessProfile.bind(VendorController)), middleware: ['auth'] },
                { method: 'POST', path: '/create', handler: wrap(VendorController.createBusinessProfile.bind(VendorController)), middleware: ['auth'] },
                { method: 'PATCH', path: '/update', handler: wrap(VendorController.updateBusinessProfile.bind(VendorController)), middleware: ['auth'] },
                { method: 'DELETE', path: '/delete', handler: wrap(VendorController.deleteBusinessProfile.bind(VendorController)), middleware: ['auth'] },
            ]),

            ...Router.group({ prefix: '/documents' }, [
                { method: 'GET', path: '/', handler: wrap(VendorController.getBusinessDocuments.bind(VendorController)), middleware: ['auth'] },
                { method: 'POST', path: '/upload', handler: wrap(VendorController.uploadBusinessDocuments.bind(VendorController)), middleware: ['auth'] },
                { method: 'PATCH', path: '/update', handler: wrap(VendorController.updateBusinessDocument.bind(VendorController)), middleware: ['auth'] },
                { method: 'DELETE', path: '/delete', handler: wrap(VendorController.deleteBusinessDocument.bind(VendorController)), middleware: ['auth'] },
            ]),
        ]),

        // Vendor Bank Details
        ...Router.group({ prefix: '/bank', middleware: ['auth'] }, [
            { method: 'GET', path: '/', handler: wrap(VendorController.getBankDetails.bind(VendorController)) },
            { method: 'POST', path: '/create', handler: wrap(VendorController.createBankDetails.bind(VendorController)) },
            { method: 'PATCH', path: '/update', handler: wrap(VendorController.updateBankDetails.bind(VendorController)) },
            { method: 'DELETE', path: '/delete', handler: wrap(VendorController.deleteBankDetails.bind(VendorController)) },
        ]),

        // Vendor Packages
        { method: 'GET', path: '/packages', handler: wrap(VendorController.getPackages.bind(VendorController)), middleware: ['auth'] },
        { method: 'POST', path: '/create-package', handler: wrap(VendorController.createPackage.bind(VendorController)), middleware: ['auth'] },
        ...Router.group({ prefix: '/package', middleware: ['auth'] }, [
            { method: 'POST', path: '/add-item', handler: wrap(VendorController.addItem.bind(VendorController)) },
            { method: 'POST', path: '/toggle-item', handler: wrap(VendorController.toggleItemStatus.bind(VendorController)) },
            { method: 'POST', path: '/toggle-category', handler: wrap(VendorController.toggleCategoryStatus.bind(VendorController)) },
            { method: 'PATCH', path: '/update-item', handler: wrap(VendorController.updateItem.bind(VendorController)) },
            { method: 'DELETE', path: '/delete-item', handler: wrap(VendorController.deleteItem.bind(VendorController)) },
        ]),
    ]),

    // User
    ...Router.group({ prefix: '/user' }, [
        { method: 'GET', path: '/packages', handler: wrap(UserController.browsePackages.bind(UserController)) },
        { method: 'POST', path: '/book', handler: wrap(UserController.bookPackage.bind(UserController)), middleware: ['auth'] },
    ]),

    // Payments
    ...Router.group({ prefix: '/payment', middleware: ['auth'] }, [
        { method: 'POST', path: '/create-order', handler: wrap(PaymentController.createOrder.bind(PaymentController)) },
        { method: 'POST', path: '/verify', handler: wrap(PaymentController.verifyPayment.bind(PaymentController)) },
    ]),

    // Admin
    ...Router.group({ prefix: '/admin', middleware: ['auth'] }, [
        { method: 'GET', path: '/stats', handler: wrap(AdminController.getStats.bind(AdminController)) },
        { method: 'GET', path: '/bookings', handler: wrap(AdminController.getBookings.bind(AdminController)) },
        { method: 'GET', path: '/vendors', handler: wrap(AdminController.getVendors.bind(AdminController)) },
        { method: 'GET', path: '/travellers', handler: wrap(AdminController.getTravellers.bind(AdminController)) },
        { method: 'GET', path: '/payment-history', handler: wrap(AdminController.getPaymentHistory.bind(AdminController)) },
        { method: 'GET', path: '/packages', handler: wrap(AdminController.getPackages.bind(AdminController)) },
        { method: 'GET', path: '/reviews', handler: wrap(AdminController.getReviews.bind(AdminController)) },
        { method: 'GET', path: '/analytics', handler: wrap(AdminController.getAnalytics.bind(AdminController)) },
        { method: 'GET', path: '/audit-logs', handler: wrap(AdminController.getAuditLogs.bind(AdminController)) },

        { method: 'POST', path: '/travellers', handler: wrap(AdminController.createTraveller.bind(AdminController)) },
        { method: 'POST', path: '/approve-vendor', handler: wrap(AdminController.approveVendor.bind(AdminController)) },
        { method: 'POST', path: '/add-package', handler: wrap(AdminController.addPackageOnBehalf.bind(AdminController)) },
        { method: 'POST', path: '/payout', handler: wrap(AdminController.markPayout.bind(AdminController)) },
        { method: 'POST', path: '/refund', handler: wrap(AdminController.refundBooking.bind(AdminController)) },
        { method: 'POST', path: '/verify-document', handler: wrap(AdminController.verifyDocument.bind(AdminController)) },
        { method: 'POST', path: '/trigger-ocr', handler: wrap(AdminController.verifyDocumentOCR.bind(AdminController)) },

        { method: 'PATCH', path: '/packages', handler: wrap(AdminController.updateServiceStatus.bind(AdminController)) },
        { method: 'PATCH', path: '/reviews', handler: wrap(AdminController.updateReviewStatus.bind(AdminController)) },

        { method: 'DELETE', path: '/reviews/:id', handler: wrap(AdminController.deleteReview.bind(AdminController)) },

        // Marketing (Banners & Coupons)
        ...Router.group({ prefix: '/marketing' }, [
            ...Router.group({ prefix: '/banners' }, [
                { method: 'GET', path: '/', handler: wrap(AdminController.getBanners.bind(AdminController)), middleware: [] },
                { method: 'POST', path: '/', handler: wrap(AdminController.createBanner.bind(AdminController)) },
                { method: 'PUT', path: '/:id', handler: wrap(AdminController.updateBanner.bind(AdminController)) },
                { method: 'DELETE', path: '/:id', handler: wrap(AdminController.deleteBanner.bind(AdminController)) },
            ]),

            ...Router.group({ prefix: '/coupons' }, [
                { method: 'GET', path: '/', handler: wrap(AdminController.getCoupons.bind(AdminController)) },
                { method: 'POST', path: '/', handler: wrap(AdminController.createCoupon.bind(AdminController)) },
                { method: 'PUT', path: '/:id', handler: wrap(AdminController.updateCoupon.bind(AdminController)) },
                { method: 'DELETE', path: '/:id', handler: wrap(AdminController.deleteCoupon.bind(AdminController)) },
            ]),
        ]),

        // Support & Inquiries
        { method: 'GET', path: '/inquiries', handler: wrap(AdminController.getInquiries.bind(AdminController)) },
        { method: 'PATCH', path: '/inquiries/:id', handler: wrap(AdminController.updateInquiry.bind(AdminController)) },
        { method: 'DELETE', path: '/inquiries/:id', handler: wrap(AdminController.deleteInquiry.bind(AdminController)) },

        // Policies (Admin management)
        ...Router.group({ prefix: '/policies' }, [
            { method: 'GET', path: '/', handler: wrap(PolicyController.getPolicies.bind(PolicyController)) },
            { method: 'POST', path: '/', handler: wrap(PolicyController.updatePolicy.bind(PolicyController)) },
            { method: 'POST', path: '/seed', handler: wrap(PolicyController.seed.bind(PolicyController)) },
        ]),

        // Location (Admin management)
        { method: 'POST', path: '/countries', handler: wrap(LocationController.createCountry.bind(LocationController)) },
        { method: 'POST', path: '/states', handler: wrap(LocationController.createState.bind(LocationController)) },
    ]),

    // Support & Inquiries (Public)
    { method: 'POST', path: '/inquiries', handler: wrap(AdminController.submitInquiry.bind(AdminController)) },

    // Categories (Public & Admin management)
    ...Router.group({ prefix: '/categories' }, [
        { method: 'GET', path: '/', handler: wrap(CategoryController.getAll.bind(CategoryController)) },
        { method: 'GET', path: '/:id', handler: wrap(CategoryController.getById.bind(CategoryController)) },
        { method: 'POST', path: '/', handler: wrap(CategoryController.create.bind(CategoryController)), middleware: ['auth'] },
        { method: 'PUT', path: '/:id', handler: wrap(CategoryController.update.bind(CategoryController)), middleware: ['auth'] },
        { method: 'DELETE', path: '/:id', handler: wrap(CategoryController.delete.bind(CategoryController)), middleware: ['auth'] },
        { method: 'POST', path: '/seed', handler: wrap(CategoryController.seed.bind(CategoryController)), middleware: ['auth'] },
    ]),

    // Policies (Explicit Aliases & Dynamic)
    ...Router.group({ prefix: '/vendor' }, [
        { method: 'GET', path: '/privacy-policy', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'vendor', type: 'privacy_policy' } },
        { method: 'GET', path: '/terms-conditions', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'vendor', type: 'terms_conditions' } },
    ]),

    ...Router.group({ prefix: '/traveller' }, [
        { method: 'GET', path: '/privacy-policy', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'traveller', type: 'privacy_policy' } },
        { method: 'GET', path: '/terms-conditions', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'traveller', type: 'terms_conditions' } },
        { method: 'GET', path: '/refund-policy', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'traveller', type: 'refund_policy' } },
        { method: 'GET', path: '/cancellation-policy', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'traveller', type: 'cancellation_policy' } },
    ]),

    ...Router.group({ prefix: '/policies' }, [
        { method: 'GET', path: '/:target/:type', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)) },
        { method: 'GET', path: '/:target', handler: wrap(PolicyController.getPoliciesByTarget.bind(PolicyController)) },
    ]),

    // Location (Public)
    ...Router.group({ prefix: '/' }, [
        { method: 'GET', path: '/countries', handler: wrap(LocationController.getCountries.bind(LocationController)) },
        { method: 'GET', path: '/countries/:id', handler: wrap(LocationController.getCountryById.bind(LocationController)) },
        { method: 'GET', path: '/states', handler: wrap(LocationController.getStates.bind(LocationController)) },
        { method: 'GET', path: '/countries/:id/states', handler: wrap(LocationController.getStatesByCountry.bind(LocationController)) },
    ]),
];

export default routes;