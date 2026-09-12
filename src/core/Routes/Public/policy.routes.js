import PolicyController from '@/core/Controllers/General/PolicyController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

export default [
    ...Router.group({ prefix: '/policies' }, [
        { method: 'GET', path: '/:target/:type', handler: wrap(() => PolicyController, 'getPolicyByType') },
        { method: 'GET', path: '/:target', handler: wrap(() => PolicyController, 'getPoliciesByTarget') },
    ]),
];
