import Router from '@/core/Routes/Router.js';
import { USER_ROLES } from '@/core/Constants/index.js';

import dashboardRoutes from './dashboard.routes.js';
import usersRoutes from './users.routes.js';
import catalogRoutes from './catalog.routes.js';
import operationsRoutes from './operations.routes.js';
import moderationRoutes from './moderation.routes.js';
import marketingRoutes from './marketing.routes.js';
import taxonomyRoutes from './taxonomy.routes.js';
import systemRoutes from './system.routes.js';

/**
 * Admin Routes - Full Enterprise Governance Hub.
 * Porto-Nested and Separated strictly from the legacy api.js manifest.
 */
const adminRoutes = [
    ...Router.group({ prefix: '/admin', middleware: ['auth'], roles: [USER_ROLES.ADMIN] }, [
        ...dashboardRoutes,
        ...usersRoutes,
        ...catalogRoutes,
        ...operationsRoutes,
        ...moderationRoutes,
        ...marketingRoutes,
        ...taxonomyRoutes,
        ...systemRoutes
    ]),
];

export default adminRoutes;
