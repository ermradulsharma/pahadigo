import Router from '@/core/Routes/Router.js';
import { USER_ROLES } from '@/core/Constants/index.js';

import authRoutes from './auth.routes.js';
import businessRoutes from './business.routes.js';
import catalogRoutes from './catalog.routes.js';
import operationsRoutes from './operations.routes.js';
import socialRoutes from './social.routes.js';

/**
 * Vendor Routes - Porto-Nested Strictly as per legacy manifest.
 * All Domain handlers are delegating to specialized granular controllers.
 */
const vendorRoutes = [
    ...Router.group({ prefix: '/vendor', middleware: ['auth'], roles: [USER_ROLES.VENDOR] }, [
        ...authRoutes,
        ...businessRoutes,
        ...catalogRoutes,
        ...operationsRoutes,
        ...socialRoutes
    ]),
];

export default vendorRoutes;
