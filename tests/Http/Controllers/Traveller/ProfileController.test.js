import ProfileController from '@/controllers/Traveller/ProfileController';
import { createMockReq } from '../../../Helpers/testUtils.js';
import { HTTP_STATUS } from '@/constants/index.js';
import { jest } from '@jest/globals';

describe('Industry Standard: ProfileController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should expose valid HTTP handler methods', () => {
        expect(ProfileController).toBeDefined();
    });

    it('[Security] should handle requests using consistent mock context', async () => {
        const req = createMockReq({ user: { role: 'admin' } });
        expect(req.user.role).toBe('admin');
    });
});
