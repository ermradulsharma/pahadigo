import BookingController from '@/core/Controllers/Admin/BookingController.js';
import PaymentController from '@/core/Controllers/Admin/PaymentController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/bookings' }, [
        { method: 'GET', path: '/', handler: wrap(() => BookingController, 'getAllBookings') },
        { method: 'POST', path: '/create', schema: schemas.adminBookingMutation, handler: wrap(() => BookingController, 'createBooking') },
        { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'show') },
        { method: 'POST', path: '/:id/invoice', schema: schemas.timelineEvent, handler: wrap(() => BookingController, 'sendInvoice') },
    ]),
    ...Router.group({ prefix: '/payments' }, [
        { method: 'GET', path: '/', handler: wrap(() => PaymentController, 'getPaymentHistory') },
        { method: 'POST', path: '/payout', schema: schemas.adminPayout, handler: wrap(() => PaymentController, 'payoutBooking') },
        { method: 'POST', path: '/refund', schema: schemas.adminRefund, handler: wrap(() => PaymentController, 'refundBooking') },
    ]),
];
