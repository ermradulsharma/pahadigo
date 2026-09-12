import { createNextRouter } from '@/core/Helpers/nextApiWrapper.js';
import travellerRoutes from '@/core/Routes/Traveller/traveller.js';
import publicRoutes from '@/core/Routes/Public/public.js';

const routerHandler = createNextRouter([...travellerRoutes, ...publicRoutes]);

const deprecatedHandler = async (req, context) => {
    const res = await routerHandler(req, context);
    if (res?.headers) {
        res.headers.set('Deprecation', 'true');
        res.headers.set('Link', '</api/v1/traveller/>; rel="successor-version"');
    }
    return res;
};

export { deprecatedHandler as GET, deprecatedHandler as POST, deprecatedHandler as PUT, deprecatedHandler as DELETE, deprecatedHandler as PATCH };
