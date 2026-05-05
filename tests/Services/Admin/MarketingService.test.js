import { jest } from '@jest/globals';
import MarketingService from '@/core/Services/Admin/MarketingService.js';
import Banner from '@/core/Models/Banner.js';
import Coupon from '@/core/Models/Coupon.js';
import AuditService from '@/core/Services/Admin/AuditService.js';

describe('Admin MarketingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Banner, 'create');
        jest.spyOn(Banner, 'find');
        jest.spyOn(Banner, 'findByIdAndUpdate');
        jest.spyOn(Banner, 'findByIdAndDelete');
        jest.spyOn(Coupon, 'create');
        jest.spyOn(Coupon, 'find');
        jest.spyOn(Coupon, 'findByIdAndUpdate');
        jest.spyOn(Coupon, 'findByIdAndDelete');
        jest.spyOn(AuditService, 'logAction').mockResolvedValue(true);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Banner Management', () => {
        test('should create banner and log audit', async () => {
            const data = { title: 'Test Banner' };
            const req = { user: { id: 'admin1' } };
            Banner.create.mockResolvedValue({ _id: 'b1', ...data });

            const result = await MarketingService.createBanner(data, req);

            expect(result.title).toBe('Test Banner');
            expect(AuditService.logAction).toHaveBeenCalledWith('admin1', 'CREATE', 'BANNER', 'b1', expect.anything(), req);
        });

        test('should update banner and log audit', async () => {
            const data = { title: 'Updated' };
            const req = { user: { id: 'admin1' } };
            Banner.findByIdAndUpdate.mockResolvedValue({ _id: 'b1', ...data });

            await MarketingService.updateBanner('b1', data, req);

            expect(Banner.findByIdAndUpdate).toHaveBeenCalledWith('b1', data, expect.anything());
            expect(AuditService.logAction).toHaveBeenCalled();
        });
    });

    describe('Coupon Management', () => {
        test('should create coupon and log audit', async () => {
            const data = { code: 'SAVE50' };
            const req = { user: { id: 'admin1' } };
            Coupon.create.mockResolvedValue({ _id: 'c1', ...data });

            const result = await MarketingService.createCoupon(data, req);

            expect(result.code).toBe('SAVE50');
            expect(AuditService.logAction).toHaveBeenCalled();
        });

        test('should delete coupon and log audit', async () => {
            const req = { user: { id: 'admin1' } };
            Coupon.findByIdAndDelete.mockResolvedValue(true);

            await MarketingService.deleteCoupon('c1', req);

            expect(Coupon.findByIdAndDelete).toHaveBeenCalledWith('c1');
            expect(AuditService.logAction).toHaveBeenCalled();
        });
    });
});
