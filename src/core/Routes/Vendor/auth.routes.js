import ProfileController from '@/core/Controllers/Vendor/ProfileController.js';
import AuthController from '@/core/Controllers/Auth/AuthController.js';
import SOSController from '@/core/Controllers/General/SOSController.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    { method: 'GET', path: '/me', handler: wrap(() => ProfileController, 'getProfile') },
    { method: 'PATCH', path: '/update', schema: schemas.profileUpdate, handler: wrap(() => ProfileController, 'updateProfile') },
    { method: 'PATCH', path: '/status', schema: schemas.vendorStatusToggle, handler: wrap(() => ProfileController, 'toggleAccountStatus') },
    { method: 'PUT', path: '/token', schema: schemas.fcmToken, handler: wrap(() => ProfileController, 'updateFCMToken') },
    { method: 'POST', path: '/delete/initiate', schema: schemas.accountDeleteInitiate, handler: wrap(() => AuthController, 'initiateDeleteAccount') },
    { method: 'DELETE', path: '/delete', schema: schemas.accountDelete, handler: wrap(() => AuthController, 'deleteAccount') },
    { method: 'POST', path: '/become-traveller', schema: schemas.settingsUpdate, handler: wrap(() => AuthController, 'downgradeToTraveller') },
    { method: 'PATCH', path: '/emergency-contacts', schema: schemas.emergencyContacts, handler: wrap(() => SOSController, 'updateEmergencyContacts') },
    { method: 'POST', path: '/sos', schema: schemas.sosAlert, handler: wrap(() => SOSController, 'triggerSOS') },
];
