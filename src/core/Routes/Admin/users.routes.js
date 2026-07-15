import TravellerController from '@/core/Controllers/Admin/TravellerController.js';
import VendorController from '@/core/Controllers/Admin/VendorController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/travellers' }, [
        { method: 'GET', path: '/', handler: wrap(() => TravellerController, 'getTravellers') },
        { method: 'GET', path: '/:id', handler: wrap(() => TravellerController, 'getTraveller') },
        { method: 'POST', path: '/create', schema: schemas.adminUserMutation, handler: wrap(() => TravellerController, 'createTraveller') },
        { method: 'PATCH', path: '/:id/update', schema: schemas.adminUserMutation, handler: wrap(() => TravellerController, 'updateTraveller') },
        { method: 'DELETE', path: '/:id/delete', schema: schemas.accountDelete, handler: wrap(() => TravellerController, 'deleteTraveller') },
    ]),
    ...Router.group({ prefix: '/vendors' }, [
        { method: 'GET', path: '/', handler: wrap(() => VendorController, 'getVendors') },
        { method: 'GET', path: '/:id', handler: wrap(() => VendorController, 'getVendorById') },
        { method: 'GET', path: '/:id/packages', handler: wrap(() => VendorController, 'getVendorPackages') },
        { method: 'POST', path: '/create', schema: schemas.adminUserMutation, handler: wrap(() => VendorController, 'createVendor') },
        { method: 'PATCH', path: '/:id/update', schema: schemas.adminUserMutation, handler: wrap(() => VendorController, 'updateVendor') },
        { method: 'DELETE', path: '/:id/delete', schema: schemas.accountDelete, handler: wrap(() => VendorController, 'deleteVendor') },
    ]),
    { method: 'POST', path: '/approve-vendor', schema: schemas.adminVendorApproval, handler: wrap(() => VendorController, 'approveVendor') },
    { method: 'POST', path: '/verify-document', schema: schemas.documentVerification, handler: wrap(() => VendorController, 'verifyDocument') },
    { method: 'POST', path: '/verify-category-document', schema: schemas.documentVerification, handler: wrap(() => VendorController, 'verifyCategoryDocument') },
    { method: 'POST', path: '/trigger-ocr', schema: schemas.documentVerification, handler: wrap(() => VendorController, 'verifyDocumentOCR') },
];
