import AdminAuthService from './Admin/AuthService.js';
import UserAuthService from './User/AuthService.js';
import BaseAuthService from './BaseAuthService.js';

/**
 * Auth Service Registry
 * Aggregates all role-based and common authentication services.
 */
export {
    AdminAuthService,
    UserAuthService,
    BaseAuthService
};

export default {
    admin: AdminAuthService,
    user: UserAuthService,
    base: BaseAuthService
};
