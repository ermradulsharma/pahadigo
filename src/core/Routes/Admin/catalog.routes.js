import PackageController from '@/core/Controllers/Admin/PackageController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/packages' }, [
        { method: 'GET', path: '/', handler: wrap(() => PackageController, 'getPackages') },
        { method: 'PATCH', path: '/:id/status', schema: schemas.packageStatus, handler: wrap(() => PackageController, 'updateServiceStatus') },
        { method: 'POST', path: '/add', schema: schemas.packageMutation, handler: wrap(() => PackageController, 'addPackageOnBehalf') },
        { method: 'POST', path: '/add-item', schema: schemas.packageMutation, handler: wrap(() => PackageController, 'addPackageItemOnBehalf') },
        { method: 'GET', path: '/item/:id', handler: wrap(() => PackageController, 'getPackageItem') },
        { method: 'PATCH', path: '/item/:id', schema: schemas.packageMutation, handler: wrap(() => PackageController, 'updatePackageItem') },
    ]),
];
