import BookingController from '@/core/Controllers/Vendor/BookingController.js';
import InventoryController from '@/core/Controllers/Vendor/InventoryController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/booking' }, [
        { method: 'GET', path: '/', handler: wrap(() => BookingController, 'getBookings') },
        { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'getBookingById') },
        { method: 'PATCH', path: '/:id/status', schema: schemas.bookingStatusUpdate, handler: wrap(() => BookingController, 'updateBookingStatus') },
        { method: 'POST', path: '/:id/timeline', schema: schemas.timelineEvent, handler: wrap(() => BookingController, 'addTimelineEvent') },
        ...Router.group({ prefix: '/otp' }, [
            { method: 'POST', path: '/offline-sync', schema: schemas.offlineOtpSync, handler: wrap(() => BookingController, 'syncOfflineOTPs') },
            { method: 'POST', path: '/:id/start', schema: schemas.otpVerify, handler: wrap(() => BookingController, 'verifyStartOTP') },
            { method: 'POST', path: '/:id/end', schema: schemas.otpVerify, handler: wrap(() => BookingController, 'verifyEndOTP') },
        ]),
    ]),
    ...Router.group({ prefix: '/inventory' }, [
        { method: 'GET', path: '/', handler: wrap(() => InventoryController, 'getInventory') },
        { method: ['POST', 'PUT', 'PATCH'], path: '/:itemId/baseline', schema: schemas.inventoryUpdate, handler: wrap(() => InventoryController, 'updateBasePrice') },
        { method: 'GET', path: '/service/:serviceType', handler: wrap(() => InventoryController, 'getInventoryItem') },
        { method: 'GET', path: '/:itemId', handler: wrap(() => InventoryController, 'getInventoryItem') },
        { method: 'POST', path: '/update', schema: schemas.inventoryUpdate, handler: wrap(() => InventoryController, 'updateInventory') },
        { method: 'POST', path: '/:itemId/update', schema: schemas.inventoryUpdate, handler: wrap(() => InventoryController, 'updateInventory') },
        { method: 'POST', path: '/:itemId/initialize', schema: schemas.inventoryUpdate, handler: wrap(() => InventoryController, 'updateInventory') },
    ]),
];
