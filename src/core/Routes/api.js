import authRoutes from './Auth/auth.js';
import adminRoutes from './Admin/admin.js';
import vendorRoutes from './Vendor/vendor.js';
import travellerRoutes from './Traveller/traveller.js';
import publicRoutes from './Public/public.js';

const routes = [
  ...publicRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...vendorRoutes,
  ...travellerRoutes,
];

export default routes;
