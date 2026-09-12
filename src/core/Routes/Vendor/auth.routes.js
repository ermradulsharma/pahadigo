import ProfileController from '@/core/Controllers/Auth/User/ProfileController.js';

import AuthController from '@/core/Controllers/Auth/AuthController.js';
import SOSController from '@/core/Controllers/General/SOSController.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    { method: 'GET', path: '/me', handler: wrap(() => ProfileController, 'getProfile') },
    { method: 'PATCH', path: '/update', schema: schemas.profileUpdate, handler: wrap(() => ProfileController, 'updateProfile') },
    { method: 'PATCH', path: '/status', schema: schemas.vendorStatusToggle, handler: wrap(() => ProfileController, 'toggleAccountStatus') },
    { method: 'PATCH', path: '/avatar', handler: wrap(() => ProfileController, 'updateProfileImage') },

    { method: 'POST', path: '/delete/initiate', schema: schemas.accountDeleteInitiate, handler: wrap(() => AuthController, 'initiateDeleteAccount') },
    { method: 'DELETE', path: '/delete', schema: schemas.accountDelete, handler: wrap(() => AuthController, 'deleteAccount') },

    { method: 'POST', path: '/become-traveller', schema: schemas.settingsUpdate, handler: wrap(() => ProfileController, 'downgradeToTraveller') },
    { method: 'PATCH', path: '/emergency-contacts', schema: schemas.emergencyContacts, handler: wrap(() => ProfileController, 'updateEmergencyContacts') },
    { method: 'POST', path: '/sos', schema: schemas.sosAlert, handler: wrap(() => ProfileController, 'triggerSOS') },
];
