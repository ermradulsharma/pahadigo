import MarketingController from '@/core/Controllers/Admin/MarketingController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/marketing' }, [
        ...Router.group({ prefix: '/banners' }, [
            { method: 'GET', path: '/', handler: wrap(() => MarketingController, 'getBanners') },
            { method: 'POST', path: '/', schema: schemas.banner, handler: wrap(() => MarketingController, 'addBanner') },
            { method: 'PUT', path: '/:id', schema: schemas.banner, handler: wrap(() => MarketingController, 'updateBanner') },
            { method: 'DELETE', path: '/:id', schema: schemas.accountDelete, handler: wrap(() => MarketingController, 'deleteBanner') },
        ]),
        ...Router.group({ prefix: '/coupons' }, [
            { method: 'GET', path: '/', handler: wrap(() => MarketingController, 'getCoupons') },
            { method: 'POST', path: '/', schema: schemas.coupon, handler: wrap(() => MarketingController, 'createCoupon') },
            { method: 'PUT', path: '/:id', schema: schemas.coupon, handler: wrap(() => MarketingController, 'updateCoupon') },
            { method: 'DELETE', path: '/:id', schema: schemas.accountDelete, handler: wrap(() => MarketingController, 'deleteCoupon') },
        ]),
    ]),
];
