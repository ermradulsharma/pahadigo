import VendorController from '@/controllers/VendorController.js';
import UserController from '@/controllers/UserController.js';
import AdminController from '@/controllers/AdminController.js';
import PolicyController from '@/controllers/PolicyController.js';
import PaymentController from '@/controllers/PaymentController.js';
import AuthController from '@/controllers/AuthController.js';
import CategoryController from '@/controllers/CategoryController.js';
import LocationController from '@/controllers/LocationController.js';
import SettingsController from '@/controllers/SettingsController.js';
import CategoryDocumentController from '@/controllers/CategoryDocumentController.js';
import BookingController from '@/controllers/BookingController.js';
import ReviewController from '@/controllers/ReviewController.js';
import SOSController from '@/controllers/SOSController.js';
import InventoryController from '@/controllers/InventoryController.js';
import { apiHandler } from '@/helpers/apiHandler.js';
import Router from './Router.js';
import { USER_ROLES, RESPONSE_MESSAGES } from '@/constants/index.js';
import { schemas } from '@/helpers/validation.js';


// Helper to wrap controller methods
const wrap = (method) => apiHandler(method);

// Define routes with method, path, handler, and optional middleware
const routes = [

    // ==========================================
    // 1. PUBLIC ROUTES (No Auth Required)
    // ==========================================

    // Auth (Login, Register, OTP, etc.)
    ...Router.group({ prefix: '/auth' }, [
        { method: 'GET', path: '/verify', handler: wrap(AuthController.verify.bind(AuthController)) },
        { method: 'GET', path: '/refresh', handler: wrap(AuthController.refresh.bind(AuthController)) },
        { method: 'POST', path: '/otp', handler: wrap(AuthController.sendOtp.bind(AuthController)) },
        { method: 'POST', path: '/login', handler: wrap(AuthController.login.bind(AuthController)), schema: schemas.passwordLogin },
        { method: 'POST', path: '/verify', handler: wrap(AuthController.verifyOtp.bind(AuthController)), schema: schemas.otpLogin },
        { method: 'POST', path: '/google', handler: wrap(AuthController.googleLogin.bind(AuthController)) },
        { method: 'POST', path: '/facebook', handler: wrap(AuthController.facebookLogin.bind(AuthController)) },
        { method: 'POST', path: '/apple', handler: wrap(AuthController.appleLogin.bind(AuthController)) },
        { method: 'POST', path: '/forget-password', handler: wrap(AuthController.forgetPassword.bind(AuthController)) },
    ]),

    // Browsing Packages & Categories
    ...Router.group({ prefix: '/packages', middleware: ['optionalAuth'] }, [
        { method: 'GET', path: '/', handler: wrap(UserController.browsePackages.bind(UserController)) },
        { method: 'GET', path: '/search', handler: wrap(UserController.searchNearby.bind(UserController)) },
        { method: 'GET', path: '/:id', handler: wrap(UserController.getPackageDetails.bind(UserController)) },
    ]),

    ...Router.group({ prefix: '/categories' }, [
        { method: 'GET', path: '/', handler: wrap(CategoryController.getAll.bind(CategoryController)) },
        { method: 'GET', path: '/:id', handler: wrap(CategoryController.getById.bind(CategoryController)) },
    ]),

    // Location / Geography Data
    ...Router.group({ prefix: '/' }, [
        { method: 'GET', path: '/countries', handler: wrap(LocationController.getCountries.bind(LocationController)) },
        { method: 'GET', path: '/countries/:id', handler: wrap(LocationController.getCountryById.bind(LocationController)) },
        { method: 'GET', path: '/states', handler: wrap(LocationController.getStates.bind(LocationController)) },
        { method: 'GET', path: '/countries/:id/states', handler: wrap(LocationController.getStatesByCountry.bind(LocationController)) },
    ]),

    // Policies
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

    // Website Inquiries & Webhooks
    { method: 'POST', path: '/inquiries', handler: wrap(AdminController.submitInquiry.bind(AdminController)) },
    ...Router.group({ prefix: '/payment' }, [
        { method: 'POST', path: '/webhook', handler: wrap(PaymentController.webhook.bind(PaymentController)) },
    ]),

    // ==========================================
    // 2. COMMON AUTHENTICATED ROUTES (Any Logged-in User)
    // ==========================================
    ...Router.group({ prefix: '/auth', middleware: ['auth'] }, [
        { method: 'GET', path: '/me', handler: wrap(AuthController.me.bind(AuthController)) },
        { method: 'POST', path: '/logout', handler: wrap(AuthController.logout.bind(AuthController)) },
        { method: 'POST', path: '/logout-all', handler: wrap(AuthController.logoutAll.bind(AuthController)) },
        { method: 'POST', path: '/update-profile', handler: wrap(AuthController.updateProfile.bind(AuthController)) },
        { method: 'POST', path: '/delete-profile', handler: wrap(AuthController.deleteProfile.bind(AuthController)) },
        { method: 'PATCH', path: '/switch-role', handler: wrap(AuthController.switchRole.bind(AuthController)) },
        { method: 'PATCH', path: '/emergency-contacts', handler: wrap(SOSController.updateEmergencyContacts.bind(SOSController)) },
    ]),

    // ==========================================
    // 3. TRAVELLER ROUTES (Requires Traveller Role)
    // ==========================================
    ...Router.group({ prefix: '/traveller', middleware: ['auth'], roles: [USER_ROLES.TRAVELLER] }, [
        { method: 'GET', path: '/me', handler: wrap(AuthController.me.bind(AuthController)) },
        { method: 'PATCH', path: '/update', handler: wrap(AuthController.updateProfile.bind(AuthController)), schema: schemas.profileUpdate },
        { method: 'DELETE', path: '/delete', handler: wrap(AuthController.deleteProfile.bind(AuthController)) },
        { method: 'POST', path: '/book', handler: wrap(BookingController.createBooking.bind(BookingController)), schema: schemas.booking },
        { method: 'GET', path: '/bookings', handler: wrap(BookingController.getMyBookings.bind(BookingController)) },
        { method: 'GET', path: '/bookings/:id', handler: wrap(BookingController.getBookingDetails.bind(BookingController)) },
        { method: 'PATCH', path: '/bookings/:id/cancel', handler: wrap(BookingController.cancelBooking.bind(BookingController)) },
        { method: 'POST', path: '/bookings/:id/dispute', handler: wrap(BookingController.raiseDispute.bind(BookingController)) },
        { method: 'POST', path: '/reviews', handler: wrap(ReviewController.addReview.bind(ReviewController)) },
        { method: 'POST', path: '/sos', handler: wrap(SOSController.triggerSOS.bind(SOSController)) },
        { method: 'GET', path: '/recent-searches', handler: wrap(UserController.getRecentSearches.bind(UserController)) },
        { method: 'DELETE', path: '/recent-searches', handler: wrap(UserController.clearRecentSearches.bind(UserController)) },
        { method: 'GET', path: '/wishlist', handler: wrap(UserController.getWishlist.bind(UserController)) },
        { method: 'POST', path: '/wishlist', handler: wrap(UserController.addToWishlist.bind(UserController)), schema: schemas.wishlist },
        { method: 'DELETE', path: '/wishlist/:itemId', handler: wrap(UserController.removeFromWishlist.bind(UserController)) },
        ...Router.group({ prefix: '/payment' }, [
            { method: 'POST', path: '/create-order', handler: wrap(PaymentController.createOrder.bind(PaymentController)) },
            { method: 'POST', path: '/verify', handler: wrap(PaymentController.verifyPayment.bind(PaymentController)) },
        ]),
        { method: 'POST', path: '/become-vendor', handler: wrap(AuthController.becomeVendor.bind(AuthController)) },

    ]),

    // ==========================================
    // 4. VENDOR ROUTES (Requires Vendor Role)
    // ==========================================
    ...Router.group({ prefix: '/vendor', middleware: ['auth'], roles: [USER_ROLES.VENDOR] }, [
        { method: 'GET', path: '/me', handler: wrap(AuthController.me.bind(AuthController)) },
        { method: 'PATCH', path: '/update', handler: wrap(AuthController.updateProfile.bind(AuthController)) },
        { method: 'DELETE', path: '/delete', handler: wrap(AuthController.deleteProfile.bind(AuthController)) },
        { method: 'POST', path: '/become-traveller', handler: wrap(AuthController.becomeTraveller.bind(AuthController)) },

        // Vendor Business
        ...Router.group({ prefix: '/business' }, [

            // Vendor Business Profile
            ...Router.group({ prefix: '/profile' }, [
                { method: 'GET', path: '/', handler: wrap(VendorController.getBusinessProfile.bind(VendorController)) },
                { method: 'POST', path: '/create', handler: wrap(VendorController.createBusinessProfile.bind(VendorController)) },
                { method: 'PATCH', path: '/update', handler: wrap(VendorController.updateBusinessProfile.bind(VendorController)) },
                { method: 'DELETE', path: '/delete', handler: wrap(VendorController.deleteBusinessProfile.bind(VendorController)) },
            ]),

            // Vendor Business Documents
            ...Router.group({ prefix: '/documents' }, [
                { method: 'GET', path: '/', handler: wrap(VendorController.getBusinessDocuments.bind(VendorController)) },
                { method: 'POST', path: '/upload', handler: wrap(VendorController.uploadBusinessDocuments.bind(VendorController)) },
                { method: 'PATCH', path: '/update', handler: wrap(VendorController.updateBusinessDocument.bind(VendorController)) },
                { method: 'DELETE', path: '/delete', handler: wrap(VendorController.deleteBusinessDocument.bind(VendorController)) },
            ]),
        ]),

        // Vendor Bank Details
        ...Router.group({ prefix: '/bank' }, [
            { method: 'GET', path: '/', handler: wrap(VendorController.getBankDetails.bind(VendorController)) },
            { method: 'POST', path: '/create', handler: wrap(VendorController.createBankDetails.bind(VendorController)) },
            { method: 'PATCH', path: '/update', handler: wrap(VendorController.updateBankDetails.bind(VendorController)) },
            { method: 'DELETE', path: '/delete', handler: wrap(VendorController.deleteBankDetails.bind(VendorController)) },
        ]),

        // Vendor Categories
        ...Router.group({ prefix: '/category' }, [
            { method: 'GET', path: '/', handler: wrap(VendorController.getVendorCategories.bind(VendorController)) },
            { method: 'POST', path: '/documents', handler: wrap(VendorController.getCategoryDocumentsBySlug.bind(VendorController)) },
            { method: 'POST', path: '/documents/upload', handler: wrap(VendorController.uploadCategoryDocument.bind(VendorController)) },
        ]),

        // Vendor Packages
        { method: 'GET', path: '/packages', handler: wrap(VendorController.getPackages.bind(VendorController)) },
        { method: 'POST', path: '/create-package', handler: wrap(VendorController.createPackage.bind(VendorController)) },
        ...Router.group({ prefix: '/package' }, [
            { method: 'GET', path: '/item/:category/:itemId', handler: wrap(VendorController.getItem.bind(VendorController)) },
            { method: 'POST', path: '/add-item', handler: wrap(VendorController.addItem.bind(VendorController)) },
            { method: 'POST', path: '/toggle-item', handler: wrap(VendorController.toggleItemStatus.bind(VendorController)) },
            { method: 'POST', path: '/toggle-category', handler: wrap(VendorController.toggleCategoryStatus.bind(VendorController)) },

            // Standard routes (ID in Body)
            { method: 'PATCH', path: '/update-item', handler: wrap(VendorController.updateItem.bind(VendorController)) },
            { method: 'PUT', path: '/update-item', handler: wrap(VendorController.updateItem.bind(VendorController)) },
            { method: 'POST', path: '/update-item', handler: wrap(VendorController.updateItem.bind(VendorController)) },

            { method: 'DELETE', path: '/delete-item', handler: wrap(VendorController.deleteItem.bind(VendorController)) },
            { method: 'POST', path: '/delete-item', handler: wrap(VendorController.deleteItem.bind(VendorController)) },

            // URL Parameter routes (ID in Path)
            { method: 'POST', path: '/:itemId/toggle-item', handler: wrap(VendorController.toggleItemStatus.bind(VendorController)) },
            { method: 'PATCH', path: '/:itemId/update-item', handler: wrap(VendorController.updateItem.bind(VendorController)) },
            { method: 'PUT', path: '/:itemId/update-item', handler: wrap(VendorController.updateItem.bind(VendorController)) },
            { method: 'POST', path: '/:itemId/update-item', handler: wrap(VendorController.updateItem.bind(VendorController)) },
            { method: 'DELETE', path: '/:itemId/delete-item', handler: wrap(VendorController.deleteItem.bind(VendorController)) },
            { method: 'POST', path: '/:itemId/delete-item', handler: wrap(VendorController.deleteItem.bind(VendorController)) },
        ]),

        // Vendor Bookings
        ...Router.group({ prefix: '/bookings' }, [
            { method: 'GET', path: '/', handler: wrap(VendorController.getBookings.bind(VendorController)) },
            { method: 'POST', path: '/:id/timeline', handler: wrap(VendorController.addTimelineEvent.bind(VendorController)) },
        ]),

        // Vendor Inventory
        ...Router.group({ prefix: '/inventory' }, [
            { method: 'GET', path: '/', handler: wrap(InventoryController.getAllInventory.bind(InventoryController)) },
            { method: 'PATCH', path: '/:itemId/baseline', handler: wrap(InventoryController.updateItemBaseline.bind(InventoryController)) },

            { method: 'GET', path: '/service/:serviceType', handler: wrap(InventoryController.getServiceInventory.bind(InventoryController)) },
            { method: 'GET', path: '/:itemId', handler: wrap(InventoryController.getItemInventory.bind(InventoryController)) },

            { method: 'POST', path: '/update', handler: wrap(InventoryController.updateInventory.bind(InventoryController)) },
            { method: 'PUT', path: '/update', handler: wrap(InventoryController.updateInventory.bind(InventoryController)) },
            { method: 'PATCH', path: '/update', handler: wrap(InventoryController.updateInventory.bind(InventoryController)) },

            { method: 'POST', path: '/:itemId/update', handler: wrap(InventoryController.updateInventory.bind(InventoryController)) },
            { method: 'PUT', path: '/:itemId/update', handler: wrap(InventoryController.updateInventory.bind(InventoryController)) },
            { method: 'PATCH', path: '/:itemId/update', handler: wrap(InventoryController.updateInventory.bind(InventoryController)) },

            { method: 'POST', path: '/:itemId/initialize', handler: wrap(InventoryController.initializeInventory.bind(InventoryController)) },
            { method: 'PUT', path: '/:itemId/initialize', handler: wrap(InventoryController.initializeInventory.bind(InventoryController)) },
        ]),
    ]),

    // ==========================================
    // 5. ADMIN ROUTES (Requires Admin Role)
    // ==========================================
    ...Router.group({ prefix: '/admin', middleware: ['auth'], roles: [USER_ROLES.ADMIN] }, [

        // --- Dashboard & General ---
        { method: 'GET', path: '/stats', handler: wrap(AdminController.getStats.bind(AdminController)) },
        { method: 'GET', path: '/analytics', handler: wrap(AdminController.getAnalytics.bind(AdminController)) },
        { method: 'GET', path: '/audit-logs', handler: wrap(AdminController.getAuditLogs.bind(AdminController)) },
        { method: 'POST', path: '/change-password', handler: wrap(AuthController.changePassword.bind(AuthController)) },
        { method: 'POST', path: '/reset-password', handler: wrap(AuthController.resetPassword.bind(AuthController)) },

        // --- Users: Travellers ---
        ...Router.group({ prefix: '/travellers' }, [
            { method: 'GET', path: '', handler: wrap(AdminController.getTravellers.bind(AdminController)) },
            { method: 'POST', path: '/create', handler: wrap(AdminController.createTraveller.bind(AdminController)) },
            { method: 'PATCH', path: '/:id/update', handler: wrap(AdminController.updateTraveller.bind(AdminController)) },
            { method: 'DELETE', path: '/:id/delete', handler: wrap(AdminController.deleteTraveller.bind(AdminController)) },
        ]),

        // --- Users: Vendors & Approvals ---
        ...Router.group({ prefix: '/vendors' }, [
            { method: 'GET', path: '', handler: wrap(AdminController.getVendors.bind(AdminController)) },
            { method: 'GET', path: '/:id', handler: wrap(AdminController.getVendorById.bind(AdminController)) },
            { method: 'GET', path: '/:id/packages', handler: wrap(AdminController.getVendorPackages.bind(AdminController)) },
            { method: 'POST', path: '/create', handler: wrap(AdminController.createVendor.bind(AdminController)) },
            { method: 'PATCH', path: '/:id/update', handler: wrap(AdminController.updateVendor.bind(AdminController)) },
            { method: 'DELETE', path: '/:id/delete', handler: wrap(AdminController.deleteVendor.bind(AdminController)) },
        ]),
        { method: 'POST', path: '/approve-vendor', handler: wrap(AdminController.approveVendor.bind(AdminController)) },

        // --- Document Verification & OCR ---
        { method: 'POST', path: '/verify-document', handler: wrap(AdminController.verifyDocument.bind(AdminController)) },
        { method: 'POST', path: '/verify-category-document', handler: wrap(AdminController.verifyCategoryDocument.bind(AdminController)) },
        { method: 'POST', path: '/trigger-ocr', handler: wrap(AdminController.verifyDocumentOCR.bind(AdminController)) },

        // --- Inventory: Packages ---
        ...Router.group({ prefix: '/packages' }, [
            { method: 'GET', path: '/', handler: wrap(AdminController.getPackages.bind(AdminController)) },
            { method: 'PATCH', path: '/:id/status', handler: wrap(AdminController.updateServiceStatus.bind(AdminController)) },
            { method: 'POST', path: '/add', handler: wrap(AdminController.addPackageOnBehalf.bind(AdminController)) },
            { method: 'GET', path: '/item/:id', handler: wrap(AdminController.getPackageItem.bind(AdminController)) },
            { method: 'PATCH', path: '/item/:id', handler: wrap(AdminController.updatePackageItem.bind(AdminController)) },
        ]),

        // --- Finances: Bookings, Payments, Refunds ---
        { method: 'GET', path: '/bookings', handler: wrap(AdminController.getBookings.bind(AdminController)) },
        { method: 'GET', path: '/payment-history', handler: wrap(AdminController.getPaymentHistory.bind(AdminController)) },
        { method: 'POST', path: '/payout', handler: wrap(AdminController.markPayout.bind(AdminController)) },
        { method: 'POST', path: '/refund', handler: wrap(AdminController.refundBooking.bind(AdminController)) },

        // --- User Feedback: Reviews ---
        ...Router.group({ prefix: '/reviews' }, [
            { method: 'GET', path: '/', handler: wrap(AdminController.getReviews.bind(AdminController)) },
            { method: 'PATCH', path: '/:id', handler: wrap(AdminController.updateReviewStatus.bind(AdminController)) },
            { method: 'DELETE', path: '/:id', handler: wrap(AdminController.deleteReview.bind(AdminController)) },
        ]),

        // --- Moderation: Disputes ---
        ...Router.group({ prefix: '/disputes' }, [
            { method: 'GET', path: '/', handler: wrap(AdminController.getDisputes.bind(AdminController)) },
            { method: 'PATCH', path: '/:id', handler: wrap(AdminController.resolveDispute.bind(AdminController)) },
        ]),

        // --- Client Queries: Inquiries ---
        ...Router.group({ prefix: '/inquiries' }, [
            { method: 'GET', path: '/', handler: wrap(AdminController.getInquiries.bind(AdminController)) },
            { method: 'PATCH', path: '/:id', handler: wrap(AdminController.updateInquiry.bind(AdminController)) },
            { method: 'DELETE', path: '/:id', handler: wrap(AdminController.deleteInquiry.bind(AdminController)) },
        ]),

        // --- Marketing: Banners & Coupons ---
        ...Router.group({ prefix: '/marketing' }, [
            ...Router.group({ prefix: '/banners' }, [
                { method: 'GET', path: '/', handler: wrap(AdminController.getBanners.bind(AdminController)) },
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

        // --- Taxonomies: Categories & Category Documents ---
        ...Router.group({ prefix: '/categories' }, [
            { method: 'POST', path: '/', handler: wrap(CategoryController.create.bind(CategoryController)) },
            { method: 'PUT', path: '/:id', handler: wrap(CategoryController.update.bind(CategoryController)) },
            { method: 'DELETE', path: '/:id', handler: wrap(CategoryController.delete.bind(CategoryController)) },
            { method: 'POST', path: '/seed', handler: wrap(CategoryController.seed.bind(CategoryController)) },
        ]),
        ...Router.group({ prefix: '/category-documents' }, [
            { method: 'GET', path: '/', handler: wrap(CategoryDocumentController.getAll.bind(CategoryDocumentController)) },
            { method: 'POST', path: '/', handler: wrap(CategoryDocumentController.create.bind(CategoryDocumentController)) },
            { method: 'GET', path: '/:id', handler: wrap(CategoryDocumentController.getById.bind(CategoryDocumentController)) },
            { method: 'PUT', path: '/:id', handler: wrap(CategoryDocumentController.update.bind(CategoryDocumentController)) },
            { method: 'DELETE', path: '/:id', handler: wrap(CategoryDocumentController.delete.bind(CategoryDocumentController)) },
        ]),

        // --- App System: Setup, Settings, Locations, Policies ---
        ...Router.group({ prefix: '/settings' }, [
            { method: 'GET', path: '/', handler: wrap(SettingsController.getSettings.bind(SettingsController)) },
            { method: 'POST', path: '/', handler: wrap(SettingsController.updateSettings.bind(SettingsController)) },
        ]),
        ...Router.group({ prefix: '/policies' }, [
            { method: 'GET', path: '/', handler: wrap(PolicyController.getPolicies.bind(PolicyController)) },
            { method: 'POST', path: '/', handler: wrap(PolicyController.updatePolicy.bind(PolicyController)) },
            { method: 'POST', path: '/seed', handler: wrap(PolicyController.seed.bind(PolicyController)) },
        ]),
        { method: 'POST', path: '/countries', handler: wrap(LocationController.createCountry.bind(LocationController)) },
        { method: 'POST', path: '/states', handler: wrap(LocationController.createState.bind(LocationController)) },
    ]),
];

export default routes;
