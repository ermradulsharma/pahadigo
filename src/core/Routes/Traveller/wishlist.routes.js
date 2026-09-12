import TravellerController from '@/core/Controllers/Traveller/TravellerController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    // Wishlist Management
    ...Router.group({ prefix: '/wishlist' }, [
        { method: 'GET', path: '/', handler: wrap(() => TravellerController, 'getWishlist') },
        { method: 'POST', path: '/:itemId', schema: schemas.wishlist, handler: wrap(() => TravellerController, 'addToWishlist') },
        { method: 'DELETE', path: '/:itemId', handler: wrap(() => TravellerController, 'removeFromWishlist') },
    ]),

    // Recent Searches
    ...Router.group({ prefix: '/recent-searches' }, [
        { method: 'GET', path: '/', handler: wrap(() => TravellerController, 'getRecentSearches') },
        { method: 'DELETE', path: '/', handler: wrap(() => TravellerController, 'clearRecentSearches') },
    ]),
];
