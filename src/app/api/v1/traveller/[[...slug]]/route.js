import { createNextRouter } from '@/core/Helpers/nextApiWrapper.js';
import travellerRoutes from '@/core/Routes/Traveller/traveller.js';
import publicRoutes from '@/core/Routes/Public/public.js';

const handler = createNextRouter([...travellerRoutes, ...publicRoutes]);
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
