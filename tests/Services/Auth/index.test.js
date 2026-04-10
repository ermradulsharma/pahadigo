import { AdminAuthService, UserAuthService, BaseAuthService } from '@/services/Auth/index.js';
import Auth from '@/services/Auth/index.js';

describe('Auth Services Index', () => {
    test('should export named services', () => {
        expect(AdminAuthService).toBeDefined();
        expect(UserAuthService).toBeDefined();
        expect(BaseAuthService).toBeDefined();
    });

    test('should export default registry mapping', () => {
        expect(Auth.admin).toBe(AdminAuthService);
        expect(Auth.user).toBe(UserAuthService);
        expect(Auth.base).toBe(BaseAuthService);
    });
});
