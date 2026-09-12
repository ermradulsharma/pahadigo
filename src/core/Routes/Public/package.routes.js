import PackageController from '@/core/Controllers/General/PackageController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

export default [
    ...Router.group({ prefix: '/packages', middleware: ['optionalAuth'] }, [
        { method: 'GET', path: '/', handler: wrap(() => PackageController, 'browsePackages') },
        { method: 'GET', path: '/search', handler: wrap(() => PackageController, 'searchNearby') },
        { method: 'GET', path: '/:id', handler: wrap(() => PackageController, 'getPackageDetails') },
    ]),
];
