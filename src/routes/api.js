import VendorController from '../controllers/VendorController.js';
import UserController from '../controllers/UserController.js';
import AdminController from '../controllers/AdminController.js';
import PolicyController from '../controllers/PolicyController.js';
import PaymentController from '../controllers/PaymentController.js';
import AuthController from '../controllers/AuthController.js';
import CategoryController from '../controllers/CategoryController.js';
import { apiHandler } from '../helpers/apiHandler.js';

// Helper to wrap controller methods
const wrap = (method) => apiHandler(method);

// Define routes with method, path, handler, and optional middleware
const routes = [
    // Consolidated Auth (Email/Phone OTP & Google)
    { method: 'POST', path: '/auth/otp', handler: wrap(AuthController.sendOtp.bind(AuthController)) },
    { method: 'POST', path: '/auth/login', handler: wrap(AuthController.login.bind(AuthController)) },
    { method: 'POST', path: '/auth/verify', handler: wrap(AuthController.verifyOtp.bind(AuthController)) },
    { method: 'POST', path: '/auth/google', handler: wrap(AuthController.googleLogin.bind(AuthController)) },
    { method: 'POST', path: '/auth/facebook', handler: wrap(AuthController.facebookLogin.bind(AuthController)) },
    { method: 'POST', path: '/auth/apple', handler: wrap(AuthController.appleLogin.bind(AuthController)) },
    { method: 'POST', path: '/auth/logout', handler: wrap(AuthController.logout.bind(AuthController)) },
    { method: 'GET', path: '/auth/verify', handler: wrap(AuthController.verify.bind(AuthController)) },
    { method: 'GET', path: '/auth/refresh', handler: wrap(AuthController.refresh.bind(AuthController)) },
    { method: 'GET', path: '/auth/me', handler: wrap(AuthController.me.bind(AuthController)), middleware: ['auth'] },
    { method: 'POST', path: '/auth/forget-password', handler: wrap(AuthController.forgetPassword.bind(AuthController)) },
    { method: 'POST', path: '/auth/reset-password', handler: wrap(AuthController.resetPassword.bind(AuthController)) },
    { method: 'POST', path: '/auth/change-password', handler: wrap(AuthController.changePassword.bind(AuthController)) },
    { method: 'POST', path: '/auth/update-profile', handler: wrap(AuthController.updateProfile.bind(AuthController)), middleware: ['auth'] },
    { method: 'POST', path: '/auth/delete-profile', handler: wrap(AuthController.deleteProfile.bind(AuthController)) },
    { method: 'POST', path: '/auth/logout-all', handler: wrap(AuthController.logoutAll.bind(AuthController)) },

    // Vendor
    { method: 'GET', path: '/vendor/categories', handler: wrap(VendorController.getCategories.bind(VendorController)) },
    { method: 'GET', path: '/vendor/profile', handler: wrap(VendorController.getProfile.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/profile/create', handler: wrap(VendorController.createProfile.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/profile/update', handler: wrap(VendorController.updateProfile.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/document/upload', handler: wrap(VendorController.uploadDocuments.bind(VendorController)), middleware: ['auth'] },
    { method: 'GET', path: '/vendor/documents', handler: wrap(VendorController.getDocuments.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/document/delete', handler: wrap(VendorController.deleteDocument.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/document/update', handler: wrap(VendorController.updateDocument.bind(VendorController)), middleware: ['auth'] },

    // Vendor Bank Details
    { method: 'POST', path: '/vendor/bank/create', handler: wrap(VendorController.createBankDetails.bind(VendorController)), middleware: ['auth'] },
    { method: 'GET', path: '/vendor/bank', handler: wrap(VendorController.getBankDetails.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/bank/update', handler: wrap(VendorController.updateBankDetails.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/bank/delete', handler: wrap(VendorController.deleteBankDetails.bind(VendorController)), middleware: ['auth'] },

    // Vendor Packages
    { method: 'POST', path: '/vendor/create-package', handler: wrap(VendorController.createPackage.bind(VendorController)), middleware: ['auth'] },
    { method: 'GET', path: '/vendor/packages', handler: wrap(VendorController.getPackages.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/package/add-item', handler: wrap(VendorController.addItem.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/package/update-item', handler: wrap(VendorController.updateItem.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/package/delete-item', handler: wrap(VendorController.deleteItem.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/package/toggle-item', handler: wrap(VendorController.toggleItemStatus.bind(VendorController)), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/package/toggle-category', handler: wrap(VendorController.toggleCategoryStatus.bind(VendorController)), middleware: ['auth'] },

    // User
    { method: 'GET', path: '/user/packages', handler: wrap(UserController.browsePackages.bind(UserController)) },
    { method: 'POST', path: '/user/book', handler: wrap(UserController.bookPackage.bind(UserController)), middleware: ['auth'] },

    // Payments
    { method: 'POST', path: '/payment/create-order', handler: wrap(PaymentController.createOrder.bind(PaymentController)), middleware: ['auth'] },
    { method: 'POST', path: '/payment/verify', handler: wrap(PaymentController.verifyPayment.bind(PaymentController)), middleware: ['auth'] },

    // Admin
    { method: 'GET', path: '/admin/stats', handler: wrap(AdminController.getStats.bind(AdminController)), middleware: ['auth'] },
    { method: 'GET', path: '/admin/bookings', handler: wrap(AdminController.getBookings.bind(AdminController)), middleware: ['auth'] },
    { method: 'GET', path: '/admin/vendors', handler: wrap(AdminController.getVendors.bind(AdminController)), middleware: ['auth'] },
    { method: 'GET', path: '/admin/travellers', handler: wrap(AdminController.getTravellers.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/travellers', handler: wrap(AdminController.createTraveller.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/approve-vendor', handler: wrap(AdminController.approveVendor.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/add-package', handler: wrap(AdminController.addPackageOnBehalf.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/payout', handler: wrap(AdminController.markPayout.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/refund', handler: wrap(AdminController.refundBooking.bind(AdminController)), middleware: ['auth'] },
    { method: 'GET', path: '/admin/payment-history', handler: wrap(AdminController.getPaymentHistory.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/verify-document', handler: wrap(AdminController.verifyDocument.bind(AdminController)), middleware: ['auth'] },
    { method: 'GET', path: '/admin/packages', handler: wrap(AdminController.getPackages.bind(AdminController)), middleware: ['auth'] },
    { method: 'PATCH', path: '/admin/packages', handler: wrap(AdminController.updateServiceStatus.bind(AdminController)), middleware: ['auth'] },
    { method: 'GET', path: '/admin/reviews', handler: wrap(AdminController.getReviews.bind(AdminController)), middleware: ['auth'] },
    { method: 'PATCH', path: '/admin/reviews', handler: wrap(AdminController.updateReviewStatus.bind(AdminController)), middleware: ['auth'] },
    { method: 'DELETE', path: '/admin/reviews/:id', handler: wrap(AdminController.deleteReview.bind(AdminController)), middleware: ['auth'] },

    // Marketing (Banners & Coupons)
    { method: 'POST', path: '/admin/marketing/banners', handler: wrap(AdminController.createBanner.bind(AdminController)), middleware: ['auth'] },
    { method: 'GET', path: '/admin/marketing/banners', handler: wrap(AdminController.getBanners.bind(AdminController)) }, // Public read often allowed, but sticking to admin mgmt. For public, user controller might be used. Wait, getBanners in AdminController is for listing.
    { method: 'PUT', path: '/admin/marketing/banners/:id', handler: wrap(AdminController.updateBanner.bind(AdminController)), middleware: ['auth'] },
    { method: 'DELETE', path: '/admin/marketing/banners/:id', handler: wrap(AdminController.deleteBanner.bind(AdminController)), middleware: ['auth'] },

    { method: 'POST', path: '/admin/marketing/coupons', handler: wrap(AdminController.createCoupon.bind(AdminController)), middleware: ['auth'] },
    { method: 'GET', path: '/admin/marketing/coupons', handler: wrap(AdminController.getCoupons.bind(AdminController)), middleware: ['auth'] },
    { method: 'PUT', path: '/admin/marketing/coupons/:id', handler: wrap(AdminController.updateCoupon.bind(AdminController)), middleware: ['auth'] },
    { method: 'DELETE', path: '/admin/marketing/coupons/:id', handler: wrap(AdminController.deleteCoupon.bind(AdminController)), middleware: ['auth'] },

    // Support & Inquiries
    { method: 'POST', path: '/inquiries', handler: wrap(AdminController.submitInquiry.bind(AdminController)) }, // Public
    { method: 'GET', path: '/admin/inquiries', handler: wrap(AdminController.getInquiries.bind(AdminController)), middleware: ['auth'] },
    { method: 'PATCH', path: '/admin/inquiries/:id', handler: wrap(AdminController.updateInquiry.bind(AdminController)), middleware: ['auth'] },
    { method: 'DELETE', path: '/admin/inquiries/:id', handler: wrap(AdminController.deleteInquiry.bind(AdminController)), middleware: ['auth'] },

    // Analytics
    { method: 'GET', path: '/admin/analytics', handler: wrap(AdminController.getAnalytics.bind(AdminController)), middleware: ['auth'] },

    // Audit Logs
    { method: 'GET', path: '/admin/audit-logs', handler: wrap(AdminController.getAuditLogs.bind(AdminController)), middleware: ['auth'] },

    // Categories (Admin management)
    { method: 'GET', path: '/categories', handler: wrap(CategoryController.getAll.bind(CategoryController)) },
    { method: 'GET', path: '/categories/:id', handler: wrap(CategoryController.getById.bind(CategoryController)) },
    { method: 'POST', path: '/categories', handler: wrap(CategoryController.create.bind(CategoryController)), middleware: ['auth'] },
    { method: 'PUT', path: '/categories/:id', handler: wrap(CategoryController.update.bind(CategoryController)), middleware: ['auth'] }, // Using PUT for update
    { method: 'DELETE', path: '/categories/:id', handler: wrap(CategoryController.delete.bind(CategoryController)), middleware: ['auth'] },
    { method: 'POST', path: '/categories/seed', handler: wrap(CategoryController.seed.bind(CategoryController)), middleware: ['auth'] },

    // Policies (Explicit Aliases)
    { method: 'GET', path: '/vendor/privacy-policy', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'vendor', type: 'privacy_policy' } },
    { method: 'GET', path: '/vendor/terms-conditions', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'vendor', type: 'terms_conditions' } },
    { method: 'GET', path: '/traveller/privacy-policy', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'traveller', type: 'privacy_policy' } },
    { method: 'GET', path: '/traveller/terms-conditions', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'traveller', type: 'terms_conditions' } },
    { method: 'GET', path: '/traveller/refund-policy', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'traveller', type: 'refund_policy' } },
    { method: 'GET', path: '/traveller/cancellation-policy', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)), params: { target: 'traveller', type: 'cancellation_policy' } },

    { method: 'GET', path: '/policies/:target/:type', handler: wrap(PolicyController.getPolicyByType.bind(PolicyController)) },
    { method: 'GET', path: '/policies/:target', handler: wrap(PolicyController.getPoliciesByTarget.bind(PolicyController)) },
    { method: 'GET', path: '/admin/policies', handler: wrap(PolicyController.getPolicies.bind(PolicyController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/policies', handler: wrap(PolicyController.updatePolicy.bind(PolicyController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/policies/seed', handler: wrap(PolicyController.seed.bind(PolicyController)), middleware: ['auth'] },
];

export default routes;
