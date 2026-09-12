import ProfileController from '@/core/Controllers/Auth/User/ProfileController.js';
import AuthController from '@/core/Controllers/Auth/AuthController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    // Core Identity & Lifecycle
    { method: 'GET', path: '/me', handler: wrap(() => ProfileController, 'getProfile') },
    { method: 'PATCH', path: '/status', schema: schemas.vendorStatusToggle, handler: wrap(() => ProfileController, 'toggleAccountStatus') },
    { method: 'PATCH', path: '/update', schema: schemas.profileUpdate, handler: wrap(() => ProfileController, 'updateProfile') },
    { method: 'PATCH', path: '/avatar', handler: wrap(() => ProfileController, 'updateProfileImage') },

    { method: 'POST', path: '/delete/initiate', handler: wrap(() => AuthController, 'initiateDeleteAccount') },
    { method: 'DELETE', path: '/delete', schema: schemas.accountDelete, handler: wrap(() => AuthController, 'deleteAccount') },

    { method: 'POST', path: '/become-vendor', handler: wrap(() => ProfileController, 'upgradeToVendor') },
    { method: 'PATCH', path: '/emergency-contacts', handler: wrap(() => ProfileController, 'updateEmergencyContacts') },
    { method: 'POST', path: '/sos', schema: schemas.sosAlert, handler: wrap(() => ProfileController, 'triggerSOS') },

    // Profile Hub (Social & Personal)
    ...Router.group({ prefix: '/profile' }, [
        ...Router.group({ prefix: '/vendor' }, [
            { method: 'GET', path: '/info/:userId', handler: wrap(() => ProfileController, 'getVendorProfile') },
            { method: 'GET', path: '/:businessId', handler: wrap(() => ProfileController, 'getBusinessProfile') },
        ]),
    ]),
];
