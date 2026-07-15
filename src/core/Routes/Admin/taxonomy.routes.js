import CategoryController from '@/core/Controllers/Admin/CategoryController.js';
import CategoryDocumentController from '@/core/Controllers/Admin/CategoryDocumentController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/categories' }, [
        { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getAll') },
        { method: 'POST', path: '/', schema: schemas.category, handler: wrap(() => CategoryController, 'create') },
        { method: 'PUT', path: '/:id', schema: schemas.category, handler: wrap(() => CategoryController, 'update') },
        { method: 'DELETE', path: '/:id', schema: schemas.accountDelete, handler: wrap(() => CategoryController, 'delete') },
        { method: 'POST', path: '/seed', schema: schemas.settingsUpdate, handler: wrap(() => CategoryController, 'seed') },
    ]),
    ...Router.group({ prefix: '/category-documents' }, [
        { method: 'GET', path: '/', handler: wrap(() => CategoryDocumentController, 'getAll') },
        { method: 'POST', path: '/', schema: schemas.categoryDocument, handler: wrap(() => CategoryDocumentController, 'create') },
        { method: 'GET', path: '/:id', handler: wrap(() => CategoryDocumentController, 'getById') },
        { method: 'PUT', path: '/:id', schema: schemas.categoryDocument, handler: wrap(() => CategoryDocumentController, 'update') },
        { method: 'DELETE', path: '/:id', schema: schemas.accountDelete, handler: wrap(() => CategoryDocumentController, 'delete') },
    ]),
];
