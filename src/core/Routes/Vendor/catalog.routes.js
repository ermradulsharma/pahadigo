import PackageController from '@/core/Controllers/Vendor/PackageController.js';
import CategoryController from '@/core/Controllers/Vendor/CategoryController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    { method: 'GET', path: '/packages', handler: wrap(() => PackageController, 'getPackages') },
    { method: 'POST', path: '/create-package', schema: schemas.packageMutation, handler: wrap(() => PackageController, 'createPackage') },
    ...Router.group({ prefix: '/package' }, [
        { method: 'GET', path: '/item/:category/:itemId', handler: wrap(() => PackageController, 'getPackageItem') },
        { method: 'POST', path: '/add-item', schema: schemas.packageMutation, handler: wrap(() => PackageController, 'addPackageItem') },
        { method: 'POST', path: '/toggle-item', schema: schemas.packageStatus, handler: wrap(() => PackageController, 'togglePackageItemStatus') },
        { method: 'POST', path: '/toggle-category', schema: schemas.packageStatus, handler: wrap(() => PackageController, 'toggleCategoryStatus') },
        { method: ['POST', 'PUT', 'PATCH'], path: '/update-item', schema: schemas.packageMutation, handler: wrap(() => PackageController, 'updatePackageItem') },
        { method: ['POST', 'PUT', 'DELETE'], path: '/delete-item', schema: schemas.packageMutation, handler: wrap(() => PackageController, 'removePackageItem') },
        ...Router.group({ prefix: '/:itemId' }, [
            { method: 'POST', path: '/toggle-item', schema: schemas.packageStatus, handler: wrap(() => PackageController, 'togglePackageItemStatus') },
            { method: ['POST', 'PUT', 'PATCH'], path: '/update-item', schema: schemas.packageMutation, handler: wrap(() => PackageController, 'updatePackageItem') },
            { method: ['POST', 'PUT', 'DELETE'], path: '/delete-item', schema: schemas.packageMutation, handler: wrap(() => PackageController, 'removePackageItem') },
        ]),
    ]),
    ...Router.group({ prefix: '/category' }, [
        { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getCategories') },
        { method: 'POST', path: '/', schema: schemas.categoryAssignment, handler: wrap(() => CategoryController, 'assignCategory') },
        { method: 'DELETE', path: '/:slug', schema: schemas.accountDelete, handler: wrap(() => CategoryController, 'removeCategory') },
        { method: 'GET', path: '/eligible', handler: wrap(() => CategoryController, 'getEligibleCategories') },
        { method: 'GET', path: '/requirements/:slug', handler: wrap(() => CategoryController, 'getCategoryRequirements') },
        ...Router.group({ prefix: '/documents' }, [
            { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getCategoryDocuments') },
            { method: 'POST', path: '/', schema: schemas.categoryAssignment, handler: wrap(() => CategoryController, 'getCategoryDocuments') },
            { method: 'GET', path: '/:slug', handler: wrap(() => CategoryController, 'getCategoryDocuments') },
            ...Router.group({ prefix: '/upload' }, [
                { method: 'POST', path: '/', schema: schemas.businessDocument, handler: wrap(() => CategoryController, 'uploadDocuments') },
                { method: 'POST', path: '/:slug', schema: schemas.businessDocument, handler: wrap(() => CategoryController, 'uploadDocuments') },
            ]),
            { method: 'GET', path: '/uploaded', handler: wrap(() => CategoryController, 'getUploadedDocuments') },
        ]),
    ]),
];
