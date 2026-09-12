import PaymentController from '@/core/Controllers/Traveller/PaymentController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/payment' }, [
        { method: 'POST', path: '/create-order', handler: wrap(() => PaymentController, 'createOrder') },
        { method: 'POST', path: '/verify', schema: schemas.paymentVerification, handler: wrap(() => PaymentController, 'verifyPayment') },
    ]),
];
