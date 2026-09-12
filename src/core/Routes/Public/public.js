import packageRoutes from './package.routes.js';
import categoryRoutes from './category.routes.js';
import countryRoutes from './country.routes.js';
import vendorRoutes from './vendor.routes.js';
import travellerRoutes from './traveller.routes.js';
import policyRoutes from './policy.routes.js';

import PaymentController from '@/core/Controllers/General/PaymentController.js';
import InquiryController from '@/core/Controllers/General/InquiryController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

/**
 * Public Routes - Accessible without authentication.
 * Modularized and composed from domain-specific public route modules.
 */
const publicRoutes = [
    ...packageRoutes,
    ...categoryRoutes,
    ...countryRoutes,
    ...vendorRoutes,
    ...travellerRoutes,
    ...policyRoutes,

    // General Capture Hub
    { method: 'POST', path: '/inquiries', handler: wrap(() => InquiryController, 'submitInquiry') },
    { method: 'POST', path: '/newsletter/subscribe', handler: wrap(() => InquiryController, 'subscribeNewsletter') },

    // Payment Gateway Capture
    ...Router.group({ prefix: '/payment' }, [
        { method: 'POST', path: '/webhook', handler: wrap(() => PaymentController, 'webhook') },
    ]),
];

export default publicRoutes;
