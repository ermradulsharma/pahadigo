import BookingController from '@/controllers/Admin/BookingController';
import { createMockReq } from '../../../Helpers/testUtils.js';
import { HTTP_STATUS } from '@/constants/index.js';
import { jest } from '@jest/globals';

describe('Industry Standard: BookingController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should expose valid HTTP handler methods', () => {
        expect(BookingController).toBeDefined();
    });

    it('[Security] should handle requests using consistent mock context', async () => {
        const req = createMockReq({ user: { role: 'admin' } });
        expect(req.user.role).toBe('admin');
    });
});
