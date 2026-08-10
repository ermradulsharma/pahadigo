import MarketingService from '@/core/Services/Admin/MarketingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import { z } from 'zod';
import { validate } from '@/core/Helpers/validation.js';
import AppError from '@/core/Helpers/AppError.js';

const bannerSchema = z.object({
  title: z.string().min(2),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.number().int().optional(),
  isActive: z.boolean().optional()
});

const couponSchema = z.object({
  code: z.string().min(3),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  maxUses: z.number().int().optional(),
  expiryDate: z.string().optional(),
  isActive: z.boolean().optional()
});

/**
 * MarketingController (Admin Role)
 * Platform-wide promotions, dynamic banners, and discount coupons.
 */
class MarketingController extends Controller {

  // GET /admin/marketing/banners
  async getBanners(req) {
    try {
      const banners = await MarketingService.getBanners();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.BANNERS_FETCHED, { banners });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/marketing/banners
  async addBanner(req) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(bannerSchema, rawBody);
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const banner = await MarketingService.createBanner(data, req);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { banner });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PUT /admin/marketing/banners/:id
  async updateBanner(req, { params }) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(bannerSchema.partial(), rawBody);
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const banner = await MarketingService.updateBanner(params.id, data, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { banner });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/marketing/banners/:id
  async deleteBanner(req, { params }) {
    try {
      await MarketingService.deleteBanner(params.id, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/marketing/coupons
  async getCoupons(req) {
    try {
      const coupons = await MarketingService.getCoupons();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.COUPONS_FETCHED, { coupons });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/marketing/coupons
  async createCoupon(req) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(couponSchema, rawBody);
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const coupon = await MarketingService.createCoupon(data, req);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { coupon });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PUT /admin/marketing/coupons/:id
  async updateCoupon(req, { params }) {
    try {
      const rawBody = await req.json();
      const { success, data, error } = validate(couponSchema.partial(), rawBody);
      if (!success) throw new AppError(error, HTTP_STATUS.BAD_REQUEST);

      const coupon = await MarketingService.updateCoupon(params.id, data, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { coupon });
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/marketing/coupons/:id
  async deleteCoupon(req, { params }) {
    try {
      await MarketingService.deleteCoupon(params.id, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      if (error instanceof AppError) return this.error(error.statusCode, error.message);
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const marketingController = new MarketingController();
export default marketingController;
