import AuthController from '@/core/Controllers/Auth/AuthController.js';
import Router from '@/core/Routes/Router.js';
import { wrap } from '@/core/Routes/helpers.js';

/**
 * Auth Routes - Separated Out from legacy manifest.
 * Preserves the exact nested grouping of the original api.js.
 */
const authRoutes = [

  // Public Auth (Matches Line 31-43)
  ...Router.group({ prefix: '/auth' }, [
    { method: 'POST', path: '/otp', handler: wrap(() => AuthController, 'initiateOTP') },
    { method: 'POST', path: '/verify', handler: wrap(() => AuthController, 'confirmOTP') },
    { method: 'GET', path: '/verify', handler: wrap(() => AuthController, 'verifyToken') },
    { method: 'GET', path: '/refresh', handler: wrap(() => AuthController, 'refreshToken') },
    { method: 'POST', path: '/login', handler: wrap(() => AuthController, 'authenticate') },
    { method: 'POST', path: '/google', handler: wrap(() => AuthController, 'socialAuthenticateGoogle') },
    { method: 'POST', path: '/facebook', handler: wrap(() => AuthController, 'socialAuthenticateFacebook') },
    { method: 'POST', path: '/apple', handler: wrap(() => AuthController, 'socialAuthenticateApple') },
    { method: 'POST', path: '/forget-password', handler: wrap(() => AuthController, 'forgotPassword') },
  ]),

  // Authenticated Session Management
  ...Router.group({ prefix: '/auth', middleware: ['auth'] }, [
    { method: 'POST', path: '/logout', handler: wrap(() => AuthController, 'logout') },
  ]),
];

export default authRoutes;
