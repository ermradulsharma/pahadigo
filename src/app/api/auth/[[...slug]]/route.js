import { createNextRouter } from '@/core/Helpers/nextApiWrapper.js';
import authRoutes from '@/core/Routes/Auth/auth.js';

const handler = createNextRouter(authRoutes);
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
