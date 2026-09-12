import BookingController from '@/core/Controllers/Traveller/BookingController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/booking' }, [
        { method: 'GET', path: '/', handler: wrap(() => BookingController, 'getBookings') },
        { method: 'POST', path: '/:id', schema: schemas.booking, handler: wrap(() => BookingController, 'initiateBooking') },
        { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'getBookingById') },
        { method: 'PATCH', path: '/:id/cancel', schema: schemas.bookingCancellation, handler: wrap(() => BookingController, 'cancelBooking') },
        { method: 'POST', path: '/:id/dispute', schema: schemas.bookingDispute, handler: wrap(() => BookingController, 'reportDispute') },
        ...Router.group({ prefix: '/payment' }, [
            { method: 'POST', path: '/:id', handler: wrap(() => BookingController, 'initializePayment') },
            { method: 'POST', path: '/:id/verify', schema: schemas.paymentVerification, handler: wrap(() => BookingController, 'verifyPayment') },
        ]),
        ...Router.group({ prefix: '/otp' }, [
            { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'getBookingOTP') },
        ]),
        { method: 'POST', path: '/:id/start', handler: wrap(() => BookingController, 'startBooking') },
        { method: 'POST', path: '/:id/complete', handler: wrap(() => BookingController, 'completeBooking') },
    ]),
];
