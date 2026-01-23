const VendorController = require('../controllers/VendorController');
const UserController = require('../controllers/UserController');
const AdminController = require('../controllers/AdminController');
const PaymentController = require('../controllers/PaymentController');
const AuthController = require('../controllers/AuthController');

// Define routes with method, path, handler, and optional middleware
const routes = [
    // Consolidated Auth (Email/Phone OTP & Google)
    { method: 'POST', path: '/auth/otp', handler: AuthController.sendOtp.bind(AuthController) },
    { method: 'POST', path: '/auth/verify', handler: AuthController.verifyOtp.bind(AuthController) },
    { method: 'POST', path: '/auth/google', handler: AuthController.googleLogin.bind(AuthController) },
    { method: 'POST', path: '/auth/facebook', handler: AuthController.facebookLogin.bind(AuthController) },
    { method: 'POST', path: '/auth/apple', handler: AuthController.appleLogin.bind(AuthController) },

    // Vendor
    { method: 'GET', path: '/vendor/categories', handler: VendorController.getCategories.bind(VendorController) },
    { method: 'GET', path: '/vendor/profile', handler: VendorController.getProfile.bind(VendorController), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/profile/create', handler: VendorController.createProfile.bind(VendorController), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/profile/update', handler: VendorController.updateProfile.bind(VendorController), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/document/upload', handler: VendorController.uploadDocuments.bind(VendorController), middleware: ['auth'] },
    { method: 'GET', path: '/vendor/documents', handler: VendorController.getDocuments.bind(VendorController), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/document/delete', handler: VendorController.deleteDocument.bind(VendorController), middleware: ['auth'] },
    { method: 'POST', path: '/vendor/document/update', handler: VendorController.updateDocument.bind(VendorController), middleware: ['auth'] },

    // Vendor Packages
    { method: 'POST', path: '/vendor/create-package', handler: VendorController.createPackage.bind(VendorController), middleware: ['auth'] },

    // User
    { method: 'GET', path: '/user/packages', handler: UserController.browsePackages.bind(UserController) },
    { method: 'POST', path: '/user/book', handler: UserController.bookPackage.bind(UserController), middleware: ['auth'] },

    // Payments
    { method: 'POST', path: '/payment/create-order', handler: PaymentController.createOrder.bind(PaymentController), middleware: ['auth'] },
    { method: 'POST', path: '/payment/verify', handler: PaymentController.verifyPayment.bind(PaymentController), middleware: ['auth'] },

    // Admin
    { method: 'GET', path: '/admin/stats', handler: AdminController.getStats.bind(AdminController), middleware: ['auth'] },
    { method: 'GET', path: '/admin/bookings', handler: AdminController.getBookings.bind(AdminController), middleware: ['auth'] },
    { method: 'GET', path: '/admin/vendors', handler: AdminController.getVendors.bind(AdminController), middleware: ['auth'] },
    { method: 'POST', path: '/admin/approve-vendor', handler: AdminController.approveVendor.bind(AdminController), middleware: ['auth'] },
    { method: 'POST', path: '/admin/add-package', handler: AdminController.addPackageOnBehalf.bind(AdminController), middleware: ['auth'] },
    { method: 'POST', path: '/admin/payout', handler: AdminController.markPayout.bind(AdminController), middleware: ['auth'] },
    { method: 'POST', path: '/admin/refund', handler: AdminController.refundBooking.bind(AdminController), middleware: ['auth'] },
    { method: 'GET', path: '/admin/payment-history', handler: AdminController.getPaymentHistory.bind(AdminController), middleware: ['auth'] },
    { method: 'GET', path: '/admin/bookings', handler: AdminController.getBookings.bind(AdminController), middleware: ['auth'] },
    { method: 'GET', path: '/admin/vendors', handler: AdminController.getVendors.bind(AdminController), middleware: ['auth'] },
    { method: 'POST', path: '/admin/approve-vendor', handler: AdminController.approveVendor.bind(AdminController), middleware: ['auth'] },
    { method: 'POST', path: '/admin/add-package', handler: AdminController.addPackageOnBehalf.bind(AdminController), middleware: ['auth'] },
    { method: 'POST', path: '/admin/payout', handler: AdminController.markPayout.bind(AdminController), middleware: ['auth'] },
];

module.exports = routes;
