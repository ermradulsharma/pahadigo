import DashboardController from '@/core/Controllers/Admin/DashboardController.js';
import AuthController from '@/core/Controllers/Auth/AuthController.js';
import ProfileController from '@/core/Controllers/Admin/ProfileController.js';
import { wrap } from '@/core/Routes/helpers.js';
import { schemas } from '@/core/Helpers/validation.js';

export default [
    { method: 'GET', path: '/stats', handler: wrap(() => DashboardController, 'getStats') },
    { method: 'GET', path: '/analytics', handler: wrap(() => DashboardController, 'getAnalytics') },
    { method: 'GET', path: '/audit-logs', handler: wrap(() => DashboardController, 'getAuditLogs') },
    { method: 'POST', path: '/change-password', schema: schemas.passwordChange, handler: wrap(() => AuthController, 'changePassword') },
    { method: 'POST', path: '/reset-password', schema: schemas.passwordReset, handler: wrap(() => AuthController, 'resetPassword') },
    { method: 'GET', path: '/profile', handler: wrap(() => ProfileController, 'getProfile') },
    { method: 'PATCH', path: '/profile', schema: schemas.adminProfileUpdate, handler: wrap(() => ProfileController, 'updateProfile') },
];
