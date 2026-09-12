import PolicyController from '@/core/Controllers/General/PolicyController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

export default [
    ...Router.group({ prefix: '/vendor' }, [
        { method: 'GET', path: '/privacy-policy', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'vendor', type: 'privacy_policy' } },
        { method: 'GET', path: '/terms-conditions', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'vendor', type: 'terms_conditions' } },
    ]),
];
