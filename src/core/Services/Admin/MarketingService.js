import Banner from '@/models/Banner.js';
import Coupon from '@/models/Coupon.js';
import AuditService from './AuditService.js';

/**
 * MarketingService (Admin Role)
 * Administration of marketing assets, promotional banners, and discount coupons.
 */
class MarketingService {
    async createBanner(data, req = null) {
        const b = await Banner.create(data);
        if (req && req.user) await AuditService.logAction(req.user.id, 'CREATE', 'BANNER', b._id, { title: b.title }, req);
        return b;
    }

    async getBanners() {
        return await Banner.find().sort({ position: 1 });
    }

    async updateBanner(id, data, req = null) {
        const b = await Banner.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (req && req.user) await AuditService.logAction(req.user.id, 'UPDATE', 'BANNER', id, { changes: data }, req);
        return b;
    }

    async deleteBanner(id, req = null) {
        if (req && req.user) await AuditService.logAction(req.user.id, 'DELETE', 'BANNER', id, {}, req);
        return await Banner.findByIdAndDelete(id);
    }

    async createCoupon(data, req = null) {
        const c = await Coupon.create(data);
        if (req && req.user) await AuditService.logAction(req.user.id, 'CREATE', 'COUPON', c._id, { code: c.code }, req);
        return c;
    }

    async getCoupons() {
        return await Coupon.find().sort({ createdAt: -1 });
    }

    async updateCoupon(id, data, req = null) {
        const c = await Coupon.findByIdAndUpdate(id, data, { returnDocument: 'after' });
        if (req && req.user) await AuditService.logAction(req.user.id, 'UPDATE', 'COUPON', id, { changes: data }, req);
        return c;
    }

    async deleteCoupon(id, req = null) {
        if (req && req.user) await AuditService.logAction(req.user.id, 'DELETE', 'COUPON', id, {}, req);
        return await Coupon.findByIdAndDelete(id);
    }
}

export default new MarketingService();
