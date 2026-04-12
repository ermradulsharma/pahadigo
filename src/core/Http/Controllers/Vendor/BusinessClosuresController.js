import ClosureService from '@/services/Vendor/ClosureService.js';
import BusinessService from '@/services/Vendor/BusinessService.js';
import { HTTP_STATUS } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * BusinessClosuresController (Vendor Role) - Specialized management of
 * business shutdown periods and operational availability.
 */
class BusinessClosuresController extends Controller {

    // GET /vendor/business/closures
    async getClosures(req) {
        try {
            const closures = await ClosureService.getClosurePeriods(req.user.id);
            return this.success(HTTP_STATUS.OK, "Closure periods fetched", closures);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // POST /vendor/business/closures
    async createClosure(req) {
        try {
            const body = req.payload;
            const result = await ClosureService.createClosurePeriod(req.user.id, body);
            return this.success(HTTP_STATUS.CREATED, "Closure added", result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // PATCH /vendor/business/closures/:id
    async updateClosure(req, { params }) {
        try {
            const body = req.payload;
            const result = await ClosureService.updateClosurePeriod(req.user.id, params.id, body);
            return this.success(HTTP_STATUS.OK, "Closure updated", result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // DELETE /vendor/business/closures/:id
    async deleteClosure(req, { params }) {
        try {
            const result = await ClosureService.removeClosurePeriod(req.user.id, params.id);
            return this.success(HTTP_STATUS.OK, "Closure deleted", result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }
}

const businessClosuresController = new BusinessClosuresController();
export default businessClosuresController;
