import AuthController from '@/controllers/Auth/AuthController.js';
import SOSController from '@/controllers/General/SOSController.js';
import Router from '../Router.js';
import { wrap } from '../helpers.js';

/**
 * Auth Routes - Separated Out from legacy manifest.
 * Preserves the exact nested grouping of the original api.js.
 */
const authRoutes = [

  // Public Auth (Matches Line 31-43)
  ...Router.group({ prefix: '/auth' }, [
    { method: 'GET', path: '/verify', handler: wrap(() => AuthController, 'verifyToken') },
    { method: 'POST', path: '/verify', handler: wrap(() => AuthController, 'confirmOTP') },
    { method: 'GET', path: '/refresh', handler: wrap(() => AuthController, 'refreshToken') },
    { method: 'POST', path: '/otp', handler: wrap(() => AuthController, 'initiateOTP') },
    { method: 'POST', path: '/login', handler: wrap(() => AuthController, 'authenticate') },
    { method: 'POST', path: '/google', handler: wrap(() => AuthController, 'socialAuthenticateGoogle') },
    { method: 'POST', path: '/facebook', handler: wrap(() => AuthController, 'socialAuthenticateFacebook') },
    { method: 'POST', path: '/apple', handler: wrap(() => AuthController, 'socialAuthenticateApple') },
    { method: 'POST', path: '/forget-password', handler: wrap(() => AuthController, 'forgotPassword') },
  ]),

  // Authenticated Auth (Matches Line 71-79)
  ...Router.group({ prefix: '/auth', middleware: ['auth'] }, [
    { method: 'GET', path: '/me', handler: wrap(() => AuthController, 'getUserProfile') },
    { method: 'POST', path: '/logout', handler: wrap(() => AuthController, 'logout') },
    { method: 'POST', path: '/update-profile', handler: wrap(() => AuthController, 'updateUserProfile') },
    { method: 'POST', path: '/delete-profile', handler: wrap(() => AuthController, 'deleteAccount') },
    { method: 'PATCH', path: '/switch-role', handler: wrap(() => AuthController, 'switchRole') },
    { method: 'PATCH', path: '/emergency-contacts', handler: wrap(() => SOSController, 'updateEmergencyContacts') },
  ]),
];

export default authRoutes;
