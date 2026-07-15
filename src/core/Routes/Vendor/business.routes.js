import BusinessController from '@/core/Controllers/Vendor/BusinessController.js';
import BusinessDocumentController from '@/core/Controllers/Vendor/BusinessDocumentController.js';
import BusinessClosuresController from '@/core/Controllers/Vendor/BusinessClosuresController.js';
import CategoryController from '@/core/Controllers/Vendor/CategoryController.js';
import BankController from '@/core/Controllers/Vendor/BankController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    ...Router.group({ prefix: '/business' }, [
        ...Router.group({ prefix: '/profile' }, [
            { method: 'GET', path: '/', handler: wrap(() => BusinessController, 'getProfile') },
            { method: 'POST', path: '/create', schema: schemas.businessProfile, handler: wrap(() => BusinessController, 'createProfile') },
            { method: 'PATCH', path: '/update/:id', schema: schemas.businessProfile, handler: wrap(() => BusinessController, 'updateProfile') },
            { method: 'DELETE', path: '/delete/:id', schema: schemas.accountDelete, handler: wrap(() => BusinessController, 'deleteProfile') },
            { method: 'PATCH', path: '/status/:id', schema: schemas.businessOperatingStatus, handler: wrap(() => BusinessController, 'updateOperatingStatus') },
        ]),
        ...Router.group({ prefix: '/documents' }, [
            { method: 'GET', path: '/', handler: wrap(() => BusinessDocumentController, 'getDocuments') },
            { method: 'POST', path: '/upload', schema: schemas.businessDocument, handler: wrap(() => BusinessDocumentController, 'uploadDocuments') },
            { method: 'PATCH', path: '/update', schema: schemas.businessDocument, handler: wrap(() => BusinessDocumentController, 'updateDocument') },
            { method: 'DELETE', path: '/delete', schema: schemas.businessDocument, handler: wrap(() => BusinessDocumentController, 'deleteDocument') },
        ]),
        ...Router.group({ prefix: '/closures' }, [
            { method: 'GET', path: '/', handler: wrap(() => BusinessClosuresController, 'getClosures') },
            { method: 'POST', path: '/', schema: schemas.businessClosure, handler: wrap(() => BusinessClosuresController, 'createClosure') },
            { method: 'PATCH', path: '/:id', schema: schemas.businessClosure, handler: wrap(() => BusinessClosuresController, 'updateClosure') },
            { method: 'DELETE', path: '/:id', schema: schemas.accountDelete, handler: wrap(() => BusinessClosuresController, 'deleteClosure') },
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
    ]),
    ...Router.group({ prefix: '/bank' }, [
        { method: 'GET', path: '/', handler: wrap(() => BankController, 'getBankDetails') },
        { method: 'POST', path: '/create', schema: schemas.bankDetails, handler: wrap(() => BankController, 'createBankDetails') },
        { method: 'PATCH', path: '/update', schema: schemas.bankDetails, handler: wrap(() => BankController, 'updateBankDetails') },
        { method: 'DELETE', path: '/delete', schema: schemas.accountDelete, handler: wrap(() => BankController, 'deleteBankDetails') },
    ]),
];
