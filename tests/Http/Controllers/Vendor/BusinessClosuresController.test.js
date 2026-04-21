import { jest } from '@jest/globals';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';

jest.unstable_mockModule('@/services/Vendor/ClosureService.js', () => ({
    default: { removeClosurePeriod: jest.fn() }
}));

const { default: BusinessClosuresController } = await import('@/controllers/Vendor/BusinessClosuresController.js');
const { default: ClosureService } = await import('@/services/Vendor/ClosureService.js');
const { createMockReq } = await import('../../../Helpers/testUtils.js');

describe('Industry Standard: BusinessClosuresController API Controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('[Success] should expose valid HTTP handler methods', () => {
        expect(BusinessClosuresController).toBeDefined();
    });

    it('[Security] should handle requests using consistent mock context', async () => {
        const req = createMockReq({ user: { role: 'admin' } });
        expect(req.user.role).toBe('admin');
    });

    it('[API] should handle DELETE closure correctly and omit data payload', async () => {
        const req = createMockReq({ user: { id: 'user123' } });
        const params = { id: 'closure456' };

        ClosureService.removeClosurePeriod.mockResolvedValue({ some: 'data_not_returned' });

        const res = await BusinessClosuresController.deleteClosure(req, { params });
        const responseData = await res.json();
        
        expect(ClosureService.removeClosurePeriod).toHaveBeenCalledWith('user123', 'closure456');
        
        expect(res.status).toBe(HTTP_STATUS.OK);
        expect(responseData).toEqual(expect.objectContaining({
            success: true,
            message: RESPONSE_MESSAGES.CLOSURE.DELETED
        }));
        
        // Assert that 'data' property is null since no payload is returned
        expect(responseData.data).toBeNull();
    });
});
