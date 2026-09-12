import CategoryController from '@/core/Controllers/General/CategoryController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

export default [
    ...Router.group({ prefix: '/categories' }, [
        { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getAll') },
        { method: 'GET', path: '/:id', handler: wrap(() => CategoryController, 'getById') },
    ]),
];
