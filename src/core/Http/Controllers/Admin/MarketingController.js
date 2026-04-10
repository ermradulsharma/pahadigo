import MarketingService from '../../../Services/Admin/MarketingService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '../Controller.js';

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
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/marketing/banners
  async addBanner(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const banner = await MarketingService.createBanner(body, req);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { banner });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PUT /admin/marketing/banners/:id
  async updateBanner(req, { params }) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const banner = await MarketingService.updateBanner(params.id, body, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, { banner });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/marketing/banners/:id
  async deleteBanner(req, { params }) {
    try {
      await MarketingService.deleteBanner(params.id, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/marketing/coupons
  async getCoupons(req) {
    try {
      const coupons = await MarketingService.getCoupons();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.COUPONS_FETCHED, { coupons });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/marketing/coupons
  async addCoupon(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const coupon = await MarketingService.createCoupon(body, req);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, { coupon });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/marketing/coupons/:id
  async deleteCoupon(req, { params }) {
    try {
      await MarketingService.deleteCoupon(params.id, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const marketingController = new MarketingController();
export default marketingController;
