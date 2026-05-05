import BookingController from '@/core/Controllers/Traveller/BookingController.js';
import ProfileController from '@/core/Controllers/Traveller/ProfileController.js';
import ReviewController from '@/core/Controllers/Traveller/ReviewController.js';
import TravellerController from '@/core/Controllers/Traveller/TravellerController.js';
import PaymentController from '@/core/Controllers/Traveller/PaymentController.js';
import AuthController from '@/core/Controllers/Auth/AuthController.js';
import SOSController from '@/core/Controllers/General/SOSController.js';
import ChatController from '@/core/Http/Controllers/General/ChatController.js';
import Router from '@/core/Routes/Router.js';
import { USER_ROLES } from '@/core/Constants/index.js';
import { wrap } from '@/core/Routes/helpers.js';

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
    { method: 'PATCH', path: '/emergency-contacts', handler: wrap(() => SOSController, 'updateEmergencyContacts') },

    // Operational Bookings Group
    ...Router.group({ prefix: '/booking' }, [
      { method: 'GET', path: '/', handler: wrap(() => BookingController, 'getBookings') },
      { method: 'POST', path: '/:id', handler: wrap(() => BookingController, 'initiateBooking') },
      { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'getBookingById') },
      { method: 'PATCH', path: '/:id/cancel', handler: wrap(() => BookingController, 'cancelBooking') },
      { method: 'POST', path: '/:id/dispute', handler: wrap(() => BookingController, 'reportDispute') },
      ...Router.group({ prefix: '/payment' }, [
        { method: 'POST', path: '/:id', handler: wrap(() => BookingController, 'initializePayment') },
        { method: 'POST', path: '/:id/verify', handler: wrap(() => BookingController, 'verifyPayment') },
      ]),
      ...Router.group({ prefix: '/otp' }, [
        { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'getBookingOTP') },
      ]),
    ]),

    // Specialized Modules
    { method: 'POST', path: '/reviews', handler: wrap(() => ReviewController, 'submitReview') },
    { method: 'POST', path: '/sos', handler: wrap(() => SOSController, 'triggerSOS') },
    { method: 'GET', path: '/recent-searches', handler: wrap(() => TravellerController, 'getRecentSearches') },
    { method: 'DELETE', path: '/recent-searches', handler: wrap(() => TravellerController, 'clearRecentSearches') },
    { method: 'GET', path: '/wishlist', handler: wrap(() => TravellerController, 'getWishlist') },
    { method: 'POST', path: '/wishlist', handler: wrap(() => TravellerController, 'addToWishlist') },
    { method: 'DELETE', path: '/wishlist/:itemId', handler: wrap(() => TravellerController, 'removeFromWishlist') },

    // Financial Payment Hub
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

    // Chat / Conversations Hub
    ...Router.group({ prefix: '/chat' }, [
      { method: 'POST', path: '/conversation', handler: wrap(() => ChatController, 'createConversation') },
      { method: 'GET', path: '/conversations', handler: wrap(() => ChatController, 'getConversations') },
      { method: 'GET', path: '/conversations/:id/messages', handler: wrap(() => ChatController, 'getMessages') },
      { method: 'POST', path: '/conversations/:id/messages', handler: wrap(() => ChatController, 'sendMessage') },
      { method: 'GET', path: '/stream', handler: wrap(() => ChatController, 'getStream') },
    ]),
  ]),
];

export default travellerRoutes;
