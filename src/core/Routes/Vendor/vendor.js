import BusinessController from '@/controllers/Vendor/BusinessController.js';
import ProfileController from '@/controllers/Vendor/ProfileController.js';
import BusinessDocumentController from '@/controllers/Vendor/BusinessDocumentController.js';
import BusinessClosuresController from '@/controllers/Vendor/BusinessClosuresController.js';
import BankController from '@/controllers/Vendor/BankController.js';
import CategoryController from '@/controllers/Vendor/CategoryController.js';

import PackageController from '@/controllers/Vendor/PackageController.js';
import BookingController from '@/controllers/Vendor/BookingController.js';
import InventoryController from '@/controllers/Vendor/InventoryController.js';
import AuthController from '@/controllers/Auth/AuthController.js';
import SOSController from '@/controllers/Traveller/SOSController.js';

import Router from '../Router.js';
import { USER_ROLES } from '@/constants/index.js';
import { wrap } from '../helpers.js';

/**
 * Vendor Routes - Porto-Nested Strictly as per legacy manifest.
 * All Domain handlers are delegating to specialized granular controllers.
 */
const vendorRoutes = [
    ...Router.group({ prefix: '/vendor', middleware: ['auth'], roles: [USER_ROLES.VENDOR] }, [

        // Auth-Identity
        { method: 'GET', path: '/me', handler: wrap(() => ProfileController, 'getProfile') },
        { method: 'PATCH', path: '/update', handler: wrap(() => ProfileController, 'updateProfile') },
        { method: 'PATCH', path: '/status', handler: wrap(() => ProfileController, 'toggleAccountStatus') },
        { method: 'DELETE', path: '/delete', handler: wrap(() => AuthController, 'deleteAccount') },
        { method: 'POST', path: '/become-traveller', handler: wrap(() => AuthController, 'downgradeToTraveller') },

        // Business Identity Group (Matches Line 146-170)
        ...Router.group({ prefix: '/business' }, [

            // Business Profile Lifecycle -> BusinessController
            ...Router.group({ prefix: '/profile' }, [
                { method: 'GET', path: '/', handler: wrap(() => BusinessController, 'getProfile') },
                { method: 'POST', path: '/create', handler: wrap(() => BusinessController, 'createProfile') },
                { method: 'PATCH', path: '/update/:id', handler: wrap(() => BusinessController, 'updateProfile') },
                { method: 'DELETE', path: '/delete/:id', handler: wrap(() => BusinessController, 'deleteProfile') },
                { method: 'PATCH', path: '/status/:id', handler: wrap(() => BusinessController, 'updateOperatingStatus') },
            ]),

            // Business Documents Hierarchy -> BusinessDocumentController
            ...Router.group({ prefix: '/documents' }, [
                { method: 'GET', path: '/', handler: wrap(() => BusinessDocumentController, 'getDocuments') },
                { method: 'POST', path: '/upload', handler: wrap(() => BusinessDocumentController, 'uploadDocuments') },
                { method: 'PATCH', path: '/update', handler: wrap(() => BusinessDocumentController, 'updateDocument') },
                { method: 'DELETE', path: '/delete', handler: wrap(() => BusinessDocumentController, 'deleteDocument') },
            ]),

            // Business Closure Analytics -> BusinessClosuresController
            ...Router.group({ prefix: '/closures' }, [
                { method: 'GET', path: '/', handler: wrap(() => BusinessClosuresController, 'getClosures') },
                { method: 'POST', path: '/', handler: wrap(() => BusinessClosuresController, 'createClosure') },
                { method: 'PATCH', path: '/:id', handler: wrap(() => BusinessClosuresController, 'updateClosure') },
                { method: 'DELETE', path: '/:id', handler: wrap(() => BusinessClosuresController, 'deleteClosure') },
            ]),

            // Taxonomy & Industry Categorization
            ...Router.group({ prefix: '/category' }, [
                { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getCategories') },
                { method: 'POST', path: '/', handler: wrap(() => CategoryController, 'assignCategory') },
                { method: 'DELETE', path: '/:slug', handler: wrap(() => CategoryController, 'removeCategory') },
                { method: 'GET', path: '/eligible', handler: wrap(() => CategoryController, 'getEligibleCategories') },
                { method: ['GET', 'POST'], path: '/documents', handler: wrap(() => CategoryController, 'getCategoryDocuments') },
                { method: 'GET', path: '/documents/:slug', handler: wrap(() => CategoryController, 'getCategoryDocuments') },
                { method: 'POST', path: '/documents/upload', handler: wrap(() => CategoryController, 'uploadDocuments') },
                { method: 'POST', path: '/documents/upload/:slug', handler: wrap(() => CategoryController, 'uploadDocuments') },
                { method: 'GET', path: '/documents/uploaded', handler: wrap(() => CategoryController, 'getUploadedDocuments') },
            ]),
        ]),

        // Financial Hierarchy -> BankController (Matches Line 172-177)
        ...Router.group({ prefix: '/bank' }, [
                { method: 'GET', path: '/', handler: wrap(() => BankController, 'getBankDetails') },
                { method: 'POST', path: '/create', handler: wrap(() => BankController, 'createBankDetails') },
                { method: 'PATCH', path: '/update', handler: wrap(() => BankController, 'updateBankDetails') },
                { method: 'DELETE', path: '/delete', handler: wrap(() => BankController, 'deleteBankDetails') },
        ]),

        // Inventory & Catalog Management
        { method: 'GET', path: '/packages', handler: wrap(() => PackageController, 'getPackages') },
        { method: 'POST', path: '/create-package', handler: wrap(() => PackageController, 'createPackage') },

        ...Router.group({ prefix: '/package' }, [
            { method: 'GET', path: '/item/:category/:itemId', handler: wrap(() => PackageController, 'getPackageItem') },
            { method: 'POST', path: '/add-item', handler: wrap(() => PackageController, 'addPackageItem') },
            { method: 'POST', path: '/toggle-item', handler: wrap(() => PackageController, 'togglePackageItemStatus') },
            { method: 'POST', path: '/toggle-category', handler: wrap(() => PackageController, 'toggleCategoryStatus') },
            { method: ['POST', 'PUT', 'PATCH'], path: '/update-item', handler: wrap(() => PackageController, 'updatePackageItem') },
            { method: ['POST', 'PUT', 'DELETE'], path: '/delete-item', handler: wrap(() => PackageController, 'removePackageItem') },

            ...Router.group({ prefix: '/:itemId' }, [
                { method: 'POST', path: '/toggle-item', handler: wrap(() => PackageController, 'togglePackageItemStatus') },
                { method: ['POST', 'PUT', 'PATCH'], path: '/update-item', handler: wrap(() => PackageController, 'updatePackageItem') },
                { method: ['POST', 'PUT', 'DELETE'], path: '/delete-item', handler: wrap(() => PackageController, 'removePackageItem') },
            ]),
        ]),

        // Operational Management
        ...Router.group({ prefix: '/bookings' }, [
            { method: 'GET', path: '/', handler: wrap(() => BookingController, 'getBookings') },
            { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'getBookingById') },
            { method: 'PATCH', path: '/:id/status', handler: wrap(() => BookingController, 'updateBookingStatus') },
            { method: 'POST', path: '/:id/timeline', handler: wrap(() => BookingController, 'addTimelineEvent') },
        ]),

        ...Router.group({ prefix: '/inventory' }, [
            { method: 'GET', path: '/', handler: wrap(() => InventoryController, 'getInventory') },
            { method: ['POST', 'PUT', 'PATCH'], path: '/:itemId/baseline', handler: wrap(() => InventoryController, 'updateBasePrice') },
            { method: 'GET', path: '/service/:serviceType', handler: wrap(() => InventoryController, 'getInventoryItem') },
            { method: 'GET', path: '/:itemId', handler: wrap(() => InventoryController, 'getInventoryItem') },
            { method: 'POST', path: '/update', handler: wrap(() => InventoryController, 'updateInventory') },
            { method: 'POST', path: '/:itemId/update', handler: wrap(() => InventoryController, 'updateInventory') },
            { method: 'POST', path: '/:itemId/initialize', handler: wrap(() => InventoryController, 'updateInventory') },
        ]),

        // Safety & SOS
        { method: 'POST', path: '/sos', handler: wrap(() => SOSController, 'triggerSOS') },
    ]),
];

export default vendorRoutes;
