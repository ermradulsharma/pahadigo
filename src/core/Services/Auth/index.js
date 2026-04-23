import AdminAuthService from '@/core/Services/Auth/Admin/AuthService.js';
import UserAuthService from '@/core/Services/Auth/User/AuthService.js';
import BaseAuthService from '@/core/Services/Auth/BaseAuthService.js';

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
