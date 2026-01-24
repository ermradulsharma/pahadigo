const VendorController = require('../controllers/VendorController');
const UserController = require('../controllers/UserController');
const AdminController = require('../controllers/AdminController');
const PaymentController = require('../controllers/PaymentController');
const AuthController = require('../controllers/AuthController');
const { apiHandler } = require('../helpers/apiHandler');

// Helper to wrap controller methods
const wrap = (method) => apiHandler(method);

// Define routes with method, path, handler, and optional middleware
const routes = [
    // Consolidated Auth (Email/Phone OTP & Google)
    { method: 'POST', path: '/auth/otp', handler: wrap(AuthController.sendOtp.bind(AuthController)) },
    { method: 'POST', path: '/auth/verify', handler: wrap(AuthController.verifyOtp.bind(AuthController)) },
    { method: 'POST', path: '/auth/google', handler: wrap(AuthController.googleLogin.bind(AuthController)) },
    { method: 'POST', path: '/auth/facebook', handler: wrap(AuthController.facebookLogin.bind(AuthController)) },
    { method: 'POST', path: '/auth/apple', handler: wrap(AuthController.appleLogin.bind(AuthController)) },
    { method: 'POST', path: '/auth/logout', handler: wrap(AuthController.logout.bind(AuthController)) },
    { method: 'GET', path: '/auth/verify', handler: wrap(AuthController.verify.bind(AuthController)) },
    { method: 'GET', path: '/auth/refresh', handler: wrap(AuthController.refresh.bind(AuthController)) },
    { method: 'GET', path: '/auth/me', handler: wrap(AuthController.me.bind(AuthController)) },
    { method: 'GET', path: '/auth/forget-password', handler: wrap(AuthController.forgetPassword.bind(AuthController)) },
    { method: 'POST', path: '/auth/reset-password', handler: wrap(AuthController.resetPassword.bind(AuthController)) },
    { method: 'POST', path: '/auth/change-password', handler: wrap(AuthController.changePassword.bind(AuthController)) },
    { method: 'POST', path: '/auth/update-profile', handler: wrap(AuthController.updateProfile.bind(AuthController)) },
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
    { method: 'POST', path: '/admin/approve-vendor', handler: wrap(AdminController.approveVendor.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/add-package', handler: wrap(AdminController.addPackageOnBehalf.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/payout', handler: wrap(AdminController.markPayout.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/refund', handler: wrap(AdminController.refundBooking.bind(AdminController)), middleware: ['auth'] },
    { method: 'GET', path: '/admin/payment-history', handler: wrap(AdminController.getPaymentHistory.bind(AdminController)), middleware: ['auth'] },
    { method: 'POST', path: '/admin/verify-document', handler: wrap(AdminController.verifyDocument.bind(AdminController)), middleware: ['auth'] },
];

module.exports = routes;
