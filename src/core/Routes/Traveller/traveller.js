import Router from '@/core/Routes/Router.js';
import { USER_ROLES } from '@/core/Constants/index.js';

import profileRoutes from './profile.routes.js';
import bookingRoutes from './booking.routes.js';
import paymentRoutes from './payment.routes.js';
import reviewRoutes from './review.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import socialRoutes from './social.routes.js';

/**
 * Traveller Routes - Consumer Experience Hub for PahadiGo.
 * Modularized Granular Domain Routes.
 */
const travellerRoutes = [
    ...Router.group({ prefix: '/traveller', middleware: ['auth'], roles: [USER_ROLES.TRAVELLER] }, [
        ...profileRoutes,
        ...bookingRoutes,
        ...paymentRoutes,
        ...reviewRoutes,
        ...wishlistRoutes,
        ...socialRoutes
    ]),
];

export default travellerRoutes;
