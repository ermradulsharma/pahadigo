import { createNextRouter } from '@/core/Helpers/nextApiWrapper.js';
import vendorRoutes from '@/core/Routes/Vendor/vendor.js';
import publicRoutes from '@/core/Routes/Public/public.js';

const handler = createNextRouter([...vendorRoutes, ...publicRoutes]);
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
