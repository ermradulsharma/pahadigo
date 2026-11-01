import Banner from '@/core/Models/Banner.js';
import Coupon from '@/core/Models/Coupon.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import AppError from '@/core/Helpers/AppError.js';
import { getBannersBy, getCouponsBy, updateById, deleteById } from '@/core/Helpers/queryHelpers.js';

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
    return await getBannersBy({}, '', null, { position: 1 });
  }

  async updateBanner(id, data, req = null) {
    const b = await updateById(Banner, id, data);
    if (!b) throw new AppError('Banner not found', 404);
    if (req && req.user) await AuditService.logAction(req.user.id, 'UPDATE', 'BANNER', id, { changes: data }, req);
    return b;
  }

  async deleteBanner(id, req = null) {
    const b = await deleteById(Banner, id);
    if (!b) throw new AppError('Banner not found', 404);
    if (req && req.user) await AuditService.logAction(req.user.id, 'DELETE', 'BANNER', id, {}, req);
    return b;
  }

  async createCoupon(data, req = null) {
    const c = await Coupon.create(data);
    if (req && req.user) await AuditService.logAction(req.user.id, 'CREATE', 'COUPON', c._id, { code: c.code }, req);
    return c;
  }

  async getCoupons() {
    return await getCouponsBy({}, '', null, { createdAt: -1 });
  }

  async updateCoupon(id, data, req = null) {
    const c = await updateById(Coupon, id, data);
    if (!c) throw new AppError('Coupon not found', 404);
    if (req && req.user) await AuditService.logAction(req.user.id, 'UPDATE', 'COUPON', id, { changes: data }, req);
    return c;
  }

  async deleteCoupon(id, req = null) {
    const c = await deleteById(Coupon, id);
    if (!c) throw new AppError('Coupon not found', 404);
    if (req && req.user) await AuditService.logAction(req.user.id, 'DELETE', 'COUPON', id, {}, req);
    return c;
  }
}

export default new MarketingService();
