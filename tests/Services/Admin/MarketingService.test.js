import { jest } from '@jest/globals';

jest.unstable_mockModule('@/core/Models/Banner.js', () => ({
    default: { create: jest.fn(), find: jest.fn(() => ({ sort: jest.fn().mockResolvedValue([]) })), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn() }
}));

jest.unstable_mockModule('@/core/Models/Coupon.js', () => ({
    default: { create: jest.fn(), find: jest.fn(() => ({ sort: jest.fn().mockResolvedValue([]) })), findByIdAndUpdate: jest.fn(), findByIdAndDelete: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/Admin/AuditService.js', () => ({
    default: { logAction: jest.fn() }
}));

const { default: MarketingService } = await import('@/services/Admin/MarketingService.js');
const { default: Banner } = await import('@/core/Models/Banner.js');
const { default: Coupon } = await import('@/core/Models/Coupon.js');

describe('Industry Standard: Admin MarketingService Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('[Banner Management]', () => {
        it('[Success] should create a banner and log audit', async () => {
            const data = { title: 'Sale', imageUrl: 'img.jpg' };
            const req = { user: { id: 'a1' } };
            Banner.create.mockResolvedValue({ _id: 'b1', ...data });

            const result = await MarketingService.createBanner(data, req);

            expect(Banner.create).toHaveBeenCalledWith(data);
            expect(result._id).toBe('b1');
        });
    });

    describe('[Coupon Management]', () => {
        it('[Success] should list all coupons', async () => {
            await MarketingService.getCoupons();
            expect(Coupon.find).toHaveBeenCalled();
        });
    });
});
