import BookingController from '@/controllers/Traveller/BookingController.js';
import ProfileController from '@/controllers/Traveller/ProfileController.js';
import ReviewController from '@/controllers/Traveller/ReviewController.js';
import TravellerController from '@/controllers/Traveller/TravellerController.js';
import PaymentController from '@/controllers/Traveller/PaymentController.js';
import AuthController from '@/controllers/Auth/AuthController.js';
import SOSController from '@/controllers/Traveller/SOSController.js';
import Router from '../Router.js';
import { USER_ROLES } from '@/constants/index.js';
import { wrap } from '../helpers.js';

/**
 * Traveller Routes - Consumer Experience Hub for PahadiGo.
 * Separated and Porto-Nested from the legacy api.js manifest.
 */
const travellerRoutes = [
  ...Router.group({ prefix: '/traveller', middleware: ['auth'], roles: [USER_ROLES.TRAVELLER] }, [
    
    // Core Identity & Lifecycle
    { method: 'GET', path: '/me', handler: wrap(() => AuthController, 'getUserProfile') },
    { method: 'PATCH', path: '/update', handler: wrap(() => AuthController, 'updateUserProfile') },
    { method: 'DELETE', path: '/delete', handler: wrap(() => AuthController, 'deleteAccount') },
    { method: 'POST', path: '/become-vendor', handler: wrap(() => AuthController, 'upgradeToVendor') },

    // Primary Booking
    { method: 'POST', path: '/book', handler: wrap(() => BookingController, 'initiateBooking') },

    // Operational Bookings Group (Matches Line 87-91)
    ...Router.group({ prefix: '/bookings' }, [
      { method: 'GET', path: '/', handler: wrap(() => BookingController, 'getBookings') },
      { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'getBookingById') },
      { method: 'PATCH', path: '/:id/cancel', handler: wrap(() => BookingController, 'cancelBooking') },
      { method: 'POST', path: '/:id/dispute', handler: wrap(() => BookingController, 'reportDispute') },
    ]),

    // Specialized Modules (Matches Line 92-101)
    { method: 'POST', path: '/reviews', handler: wrap(() => ReviewController, 'submitReview') },
    { method: 'POST', path: '/sos', handler: wrap(() => SOSController, 'triggerSOS') },
    { method: 'GET', path: '/recent-searches', handler: wrap(() => TravellerController, 'getRecentSearches') },
    { method: 'DELETE', path: '/recent-searches', handler: wrap(() => TravellerController, 'clearRecentSearches') },
    { method: 'GET', path: '/wishlist', handler: wrap(() => TravellerController, 'getWishlist') },
    { method: 'POST', path: '/wishlist', handler: wrap(() => TravellerController, 'addToWishlist') },
    { method: 'DELETE', path: '/wishlist/:itemId', handler: wrap(() => TravellerController, 'removeFromWishlist') },

    // Financial Payment Hub (Matches Line 102-105)
    ...Router.group({ prefix: '/payment' }, [
      { method: 'POST', path: '/create-order', handler: wrap(() => PaymentController, 'createOrder') },
      { method: 'POST', path: '/verify', handler: wrap(() => PaymentController, 'verifyPayment') },
    ]),

    // Profile Hub (Social & Personal)
    ...Router.group({ prefix: '/profile' }, [
        { method: 'GET', path: '/', handler: wrap(() => ProfileController, 'getProfile') },
        { method: 'PUT', path: '/', handler: wrap(() => ProfileController, 'updateProfile') },
        { method: 'POST', path: '/avatar', handler: wrap(() => ProfileController, 'updateProfileImage') },
    ]),
  ]),
];

export default travellerRoutes;
