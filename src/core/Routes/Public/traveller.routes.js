import PolicyController from '@/core/Controllers/General/PolicyController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

export default [
    ...Router.group({ prefix: '/traveller' }, [
        { method: 'GET', path: '/privacy-policy', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'traveller', type: 'privacy_policy' } },
        { method: 'GET', path: '/terms-conditions', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'traveller', type: 'terms_conditions' } },
        { method: 'GET', path: '/refund-policy', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'traveller', type: 'refund_policy' } },
        { method: 'GET', path: '/cancellation-policy', handler: wrap(() => PolicyController, 'getPolicyByType'), params: { target: 'traveller', type: 'cancellation_policy' } },
    ]),
];
