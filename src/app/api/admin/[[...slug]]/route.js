import { createNextRouter } from '@/core/Helpers/nextApiWrapper.js';
import adminRoutes from '@/core/Routes/Admin/admin.js';

const handler = createNextRouter(adminRoutes);
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
