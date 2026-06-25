import BusinessController from '@/core/Controllers/Vendor/BusinessController.js';
import ProfileController from '@/core/Controllers/Vendor/ProfileController.js';
import BusinessDocumentController from '@/core/Controllers/Vendor/BusinessDocumentController.js';
import BusinessClosuresController from '@/core/Controllers/Vendor/BusinessClosuresController.js';
import BankController from '@/core/Controllers/Vendor/BankController.js';
import CategoryController from '@/core/Controllers/Vendor/CategoryController.js';

import PackageController from '@/core/Controllers/Vendor/PackageController.js';
import BookingController from '@/core/Controllers/Vendor/BookingController.js';
import InventoryController from '@/core/Controllers/Vendor/InventoryController.js';
import AuthController from '@/core/Controllers/Auth/AuthController.js';
import SOSController from '@/core/Controllers/General/SOSController.js';
import ChatController from '@/core/Http/Controllers/General/ChatController.js';

import Router from '@/core/Routes/Router.js';
import { USER_ROLES } from '@/core/Constants/index.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

/**
 * Vendor Routes - Porto-Nested Strictly as per legacy manifest.
 * All Domain handlers are delegating to specialized granular controllers.
 */
const vendorRoutes = [
    ...Router.group({ prefix: '/vendor', middleware: ['auth'], roles: [USER_ROLES.VENDOR] }, [

        // Auth-Identity
        { method: 'GET', path: '/me', handler: wrap(() => ProfileController, 'getProfile') },
        { method: 'PATCH', path: '/update', schema: schemas.profileUpdate, handler: wrap(() => ProfileController, 'updateProfile') },
        { method: 'PATCH', path: '/status', schema: schemas.vendorStatusToggle, handler: wrap(() => ProfileController, 'toggleAccountStatus') },
        { method: 'PUT', path: '/token', schema: schemas.fcmToken, handler: wrap(() => ProfileController, 'updateFCMToken') },
        { method: 'DELETE', path: '/delete', schema: schemas.accountDelete, handler: wrap(() => AuthController, 'deleteAccount') },
        { method: 'POST', path: '/become-traveller', schema: schemas.settingsUpdate, handler: wrap(() => AuthController, 'downgradeToTraveller') },
        { method: 'PATCH', path: '/emergency-contacts', schema: schemas.emergencyContacts, handler: wrap(() => SOSController, 'updateEmergencyContacts') },

        // Business Identity Group (Matches Line 146-170)
        ...Router.group({ prefix: '/business' }, [

            // Business Profile Lifecycle -> BusinessController
            ...Router.group({ prefix: '/profile' }, [
                { method: 'GET', path: '/', handler: wrap(() => BusinessController, 'getProfile') },
                { method: 'POST', path: '/create', schema: schemas.businessProfile, handler: wrap(() => BusinessController, 'createProfile') },
                { method: 'PATCH', path: '/update/:id', schema: schemas.businessProfile, handler: wrap(() => BusinessController, 'updateProfile') },
                { method: 'DELETE', path: '/delete/:id', schema: schemas.accountDelete, handler: wrap(() => BusinessController, 'deleteProfile') },
                { method: 'PATCH', path: '/status/:id', schema: schemas.businessOperatingStatus, handler: wrap(() => BusinessController, 'updateOperatingStatus') },
            ]),

            // Business Documents Hierarchy -> BusinessDocumentController
            ...Router.group({ prefix: '/documents' }, [
                { method: 'GET', path: '/', handler: wrap(() => BusinessDocumentController, 'getDocuments') },
                { method: 'POST', path: '/upload', schema: schemas.businessDocument, handler: wrap(() => BusinessDocumentController, 'uploadDocuments') },
                { method: 'PATCH', path: '/update', schema: schemas.businessDocument, handler: wrap(() => BusinessDocumentController, 'updateDocument') },
                { method: 'DELETE', path: '/delete', schema: schemas.businessDocument, handler: wrap(() => BusinessDocumentController, 'deleteDocument') },
            ]),

            // Business Closure Analytics -> BusinessClosuresController
            ...Router.group({ prefix: '/closures' }, [
                { method: 'GET', path: '/', handler: wrap(() => BusinessClosuresController, 'getClosures') },
                { method: 'POST', path: '/', schema: schemas.businessClosure, handler: wrap(() => BusinessClosuresController, 'createClosure') },
                { method: 'PATCH', path: '/:id', schema: schemas.businessClosure, handler: wrap(() => BusinessClosuresController, 'updateClosure') },
                { method: 'DELETE', path: '/:id', schema: schemas.accountDelete, handler: wrap(() => BusinessClosuresController, 'deleteClosure') },
            ]),

            // Taxonomy & Industry Categorization
            ...Router.group({ prefix: '/category' }, [
                { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getCategories') },
                { method: 'POST', path: '/', schema: schemas.categoryAssignment, handler: wrap(() => CategoryController, 'assignCategory') },
                { method: 'DELETE', path: '/:slug', schema: schemas.accountDelete, handler: wrap(() => CategoryController, 'removeCategory') },
                { method: 'GET', path: '/eligible', handler: wrap(() => CategoryController, 'getEligibleCategories') },
                { method: 'GET', path: '/requirements/:slug', handler: wrap(() => CategoryController, 'getCategoryRequirements') },

                // Category Documents Hierarchy -> CategoryDocumentController
                ...Router.group({ prefix: '/documents' }, [
                    { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getCategoryDocuments') },
                    { method: 'POST', path: '/', schema: schemas.categoryAssignment, handler: wrap(() => CategoryController, 'getCategoryDocuments') },
                    { method: 'GET', path: '/:slug', handler: wrap(() => CategoryController, 'getCategoryDocuments') },

                    // Category Documents Upload -> CategoryDocumentController
                    ...Router.group({ prefix: '/upload' }, [
                        { method: 'POST', path: '/', schema: schemas.businessDocument, handler: wrap(() => CategoryController, 'uploadDocuments') },
                        { method: 'POST', path: '/:slug', schema: schemas.businessDocument, handler: wrap(() => CategoryController, 'uploadDocuments') },
                    ]),
                    { method: 'GET', path: '/uploaded', handler: wrap(() => CategoryController, 'getUploadedDocuments') },
                ]),
            ]),
        ]),

        // Financial Hierarchy -> BankController (Matches Line 172-177)
        ...Router.group({ prefix: '/bank' }, [
            { method: 'GET', path: '/', handler: wrap(() => BankController, 'getBankDetails') },
            { method: 'POST', path: '/create', schema: schemas.bankDetails, handler: wrap(() => BankController, 'createBankDetails') },
            { method: 'PATCH', path: '/update', schema: schemas.bankDetails, handler: wrap(() => BankController, 'updateBankDetails') },
            { method: 'DELETE', path: '/delete', schema: schemas.accountDelete, handler: wrap(() => BankController, 'deleteBankDetails') },
        ]),

        // Inventory & Catalog Management
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

        // Operational Management
        ...Router.group({ prefix: '/booking' }, [
            { method: 'GET', path: '/', handler: wrap(() => BookingController, 'getBookings') },
            { method: 'GET', path: '/:id', handler: wrap(() => BookingController, 'getBookingById') },
            { method: 'PATCH', path: '/:id/status', schema: schemas.bookingStatusUpdate, handler: wrap(() => BookingController, 'updateBookingStatus') },
            { method: 'POST', path: '/:id/timeline', schema: schemas.timelineEvent, handler: wrap(() => BookingController, 'addTimelineEvent') },
            ...Router.group({ prefix: '/otp' }, [
                { method: 'POST', path: '/:id/start', schema: schemas.otpVerify, handler: wrap(() => BookingController, 'verifyStartOTP') },
                { method: 'POST', path: '/:id/end', schema: schemas.otpVerify, handler: wrap(() => BookingController, 'verifyEndOTP') },
            ]),
        ]),

        ...Router.group({ prefix: '/inventory' }, [
            { method: 'GET', path: '/', handler: wrap(() => InventoryController, 'getInventory') },
            { method: ['POST', 'PUT', 'PATCH'], path: '/:itemId/baseline', schema: schemas.inventoryUpdate, handler: wrap(() => InventoryController, 'updateBasePrice') },
            { method: 'GET', path: '/service/:serviceType', handler: wrap(() => InventoryController, 'getInventoryItem') },
            { method: 'GET', path: '/:itemId', handler: wrap(() => InventoryController, 'getInventoryItem') },
            { method: 'POST', path: '/update', schema: schemas.inventoryUpdate, handler: wrap(() => InventoryController, 'updateInventory') },
            { method: 'POST', path: '/:itemId/update', schema: schemas.inventoryUpdate, handler: wrap(() => InventoryController, 'updateInventory') },
            { method: 'POST', path: '/:itemId/initialize', schema: schemas.inventoryUpdate, handler: wrap(() => InventoryController, 'updateInventory') },
        ]),

        // Taxonomy & Industry Categorization
        ...Router.group({ prefix: '/category' }, [
            { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getCategories') },
            { method: 'POST', path: '/', schema: schemas.categoryAssignment, handler: wrap(() => CategoryController, 'assignCategory') },
            { method: 'DELETE', path: '/:slug', schema: schemas.accountDelete, handler: wrap(() => CategoryController, 'removeCategory') },
            { method: 'GET', path: '/eligible', handler: wrap(() => CategoryController, 'getEligibleCategories') },
            { method: 'GET', path: '/requirements/:slug', handler: wrap(() => CategoryController, 'getCategoryRequirements') },

            // Category Documents Upload -> CategoryDocumentController
            ...Router.group({ prefix: '/documents' }, [
                { method: 'GET', path: '/', handler: wrap(() => CategoryController, 'getCategoryDocuments') },
                { method: 'POST', path: '/', schema: schemas.categoryAssignment, handler: wrap(() => CategoryController, 'getCategoryDocuments') },
                { method: 'GET', path: '/:slug', handler: wrap(() => CategoryController, 'getCategoryDocuments') },

                // Category Documents Upload -> CategoryDocumentController
                ...Router.group({ prefix: '/upload' }, [
                    { method: 'POST', path: '/', schema: schemas.businessDocument, handler: wrap(() => CategoryController, 'uploadDocuments') },
                    { method: 'POST', path: '/:slug', schema: schemas.businessDocument, handler: wrap(() => CategoryController, 'uploadDocuments') },
                ]),
                { method: 'GET', path: '/uploaded', handler: wrap(() => CategoryController, 'getUploadedDocuments') },
            ]),
        ]),

        // Safety & SOS
        { method: 'POST', path: '/sos', schema: schemas.sosAlert, handler: wrap(() => SOSController, 'triggerSOS') },

        // Chat / Conversations Hub
        ...Router.group({ prefix: '/chat' }, [
            { method: 'GET', path: '/stream', handler: wrap(() => ChatController, 'getStream') },
            { method: 'POST', path: '/conversation/:bookingId', schema: schemas.chatMessage, handler: wrap(() => ChatController, 'createConversation') },
            { method: 'GET', path: '/conversations', handler: wrap(() => ChatController, 'getConversations') },
            { method: 'GET', path: '/conversations/:id/messages', handler: wrap(() => ChatController, 'getMessages') },
            { method: 'POST', path: '/conversations/:id/messages', schema: schemas.chatMessage, handler: wrap(() => ChatController, 'sendMessage') },
            { method: 'PATCH', path: '/conversations/:id/read', schema: schemas.settingsUpdate, handler: wrap(() => ChatController, 'markAsRead') },
        ]),
    ]),
];

export default vendorRoutes;
