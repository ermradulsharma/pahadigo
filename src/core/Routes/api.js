import authRoutes from '@/core/Routes/Auth/auth.js';
import adminRoutes from '@/core/Routes/Admin/admin.js';
import vendorRoutes from '@/core/Routes/Vendor/vendor.js';
import travellerRoutes from '@/core/Routes/Traveller/traveller.js';
import publicRoutes from '@/core/Routes/Public/public.js';

const routes = [
  ...publicRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...vendorRoutes,
  ...travellerRoutes,
];

export default routes;
