import { jest } from '@jest/globals';
import { adminApi } from '@/core/Api/admin.js';

describe('Industry Standard: Admin Frontend API Client SDK (adminApi)', () => {
    let mockFetcher;
    let api;

    beforeEach(() => {
        mockFetcher = jest.fn().mockResolvedValue({ success: true, data: {} });
        api = adminApi(mockFetcher);
    });

    it('should expose all essential admin resource domains', () => {
        expect(api.stats).toBeDefined();
        expect(api.auditLogs).toBeDefined();
        expect(api.profile).toBeDefined();
        expect(api.travellers).toBeDefined();
        expect(api.vendors).toBeDefined();
        expect(api.compliance).toBeDefined();
        expect(api.packages).toBeDefined();
        expect(api.bookings).toBeDefined();
        expect(api.payments).toBeDefined();
        expect(api.reviews).toBeDefined();
        expect(api.disputes).toBeDefined();
        expect(api.inquiries).toBeDefined();
        expect(api.marketing).toBeDefined();
        expect(api.blogs).toBeDefined();
        expect(api.categories).toBeDefined();
        expect(api.documents).toBeDefined();
        expect(api.settings).toBeDefined();
        expect(api.policies).toBeDefined();
        expect(api.locations).toBeDefined();
    });

    it('[Stats] should invoke /api/admin/stats and /api/admin/analytics with query string', async () => {
        await api.stats.getStats();
        expect(mockFetcher).toHaveBeenCalledWith('/api/admin/stats');

        await api.stats.getAnalytics({ range: '30d' });
        expect(mockFetcher).toHaveBeenCalledWith('/api/admin/analytics?range=30d');
    });

    it('[Travellers & Vendors] should trigger CRUD routes with correct endpoints and methods', async () => {
        await api.travellers.getAll();
        expect(mockFetcher).toHaveBeenCalledWith('/api/admin/travellers');

        await api.travellers.getById('t_123');
        expect(mockFetcher).toHaveBeenCalledWith('/api/admin/travellers/t_123');

        await api.travellers.delete('t_123');
        expect(mockFetcher).toHaveBeenCalledWith('/api/admin/travellers/t_123/delete', { method: 'DELETE' });

        await api.vendors.globalApprove({ vendorId: 'v_123' });
        expect(mockFetcher).toHaveBeenCalledWith(
            '/api/admin/approve-vendor',
            expect.objectContaining({ method: 'POST', body: JSON.stringify({ vendorId: 'v_123' }) })
        );
    });

    it('[Bookings & Payments] should invoke booking and payout endpoints', async () => {
        await api.bookings.getAll({ status: 'confirmed' });
        expect(mockFetcher).toHaveBeenCalledWith('/api/admin/bookings?status=confirmed');

        await api.bookings.downloadInvoice('b_123', 'vendor');
        expect(mockFetcher).toHaveBeenCalledWith('/api/admin/bookings/b_123/download-invoice?type=vendor', { method: 'GET' });

        await api.payments.payout({ bookingId: 'b_123', amount: 5000 });
        expect(mockFetcher).toHaveBeenCalledWith(
            '/api/admin/payments/payout',
            expect.objectContaining({ method: 'POST' })
        );
    });

    it('[Blogs] should invoke blog endpoints with serialized body', async () => {
        await api.blogs.create({ title: 'Top Himalayan Treks' });
        expect(mockFetcher).toHaveBeenCalledWith(
            '/api/admin/blogs',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ title: 'Top Himalayan Treks' })
            })
        );
    });
});
