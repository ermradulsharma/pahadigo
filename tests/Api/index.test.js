import { jest } from '@jest/globals';

const mockGetToken = jest.fn();

jest.unstable_mockModule('@/app/utils/authUtils.js', () => ({
    getToken: mockGetToken
}));

const { default: api } = await import('@/core/Api/index.js');

describe('Industry Standard: Base API Client (src/core/Api/index.js)', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        global.fetch = originalFetch;
    });

    it('should export admin API client tree', () => {
        expect(api).toBeDefined();
        expect(api.admin).toBeDefined();
    });

    it('should include Bearer token when user is logged in', async () => {
        mockGetToken.mockReturnValue('user_jwt_token_sample');

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: jest.fn().mockResolvedValue({ success: true, data: { users: [] } })
        });

        const data = await api.admin.stats.getStats();

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/admin/stats',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Authorization': 'Bearer user_jwt_token_sample',
                    'Content-Type': 'application/json'
                })
            })
        );
        expect(data.success).toBe(true);
    });

    it('should handle PDF blob responses when content-type is application/pdf', async () => {
        mockGetToken.mockReturnValue(null);

        const mockBlob = { size: 1024, type: 'application/pdf' };
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            headers: new Headers({ 'content-type': 'application/pdf' }),
            blob: jest.fn().mockResolvedValue(mockBlob)
        });

        const blob = await api.admin.bookings.downloadInvoice('b_123', 'traveller');
        expect(blob).toBe(mockBlob);
    });

    it('should throw an error when server response is not ok', async () => {
        mockGetToken.mockReturnValue(null);

        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: jest.fn().mockResolvedValue({ message: 'Server failure' })
        });

        await expect(api.admin.stats.getStats()).rejects.toThrow();
    });
});
