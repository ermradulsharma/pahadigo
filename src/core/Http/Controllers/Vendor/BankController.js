import BusinessService from '@/services/Vendor/BusinessService.js';
import BankService from '@/services/Vendor/BankService.js';
import { HTTP_STATUS } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * BankController (Vendor Role) - Specialized management of
 * operational payout credentials and secure bank identity.
 */
class BankController extends Controller {

    // GET /vendor/bank/
    async getBankDetails(req) {
        try {
            const vendor = await BusinessService.getBusinessByUserId(req.user.id);
            return this.success(HTTP_STATUS.OK, "Bank details fetched", vendor.bankDetails);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // POST /vendor/bank/create
    async createBankDetails(req) {
        try {
            const body = req.payload;
            if (req.formDataBody?.has('cancelledCheque')) {
                body.cancelledChequeFile = req.formDataBody.get('cancelledCheque');
            }
            const vendor = await BankService.syncBankDetails(req.user.id, body);
            return this.success(HTTP_STATUS.CREATED, "Bank details created", vendor);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // PATCH /vendor/bank/update
    async updateBankDetails(req) {
        try {
            const body = req.payload;
            if (req.formDataBody?.has('cancelledCheque')) {
                body.cancelledChequeFile = req.formDataBody.get('cancelledCheque');
            }
            const vendor = await BankService.syncBankDetails(req.user.id, body);
            return this.success(HTTP_STATUS.OK, "Bank details updated", vendor);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // DELETE /vendor/bank/delete
    async deleteBankDetails(req) {
        try {
            const vendor = await BankService.removeBankDetails(req.user.id);
            return this.success(HTTP_STATUS.OK, "Bank details deleted successfully", vendor.bankDetails || {});
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }
}

const bankController = new BankController();
export default bankController;
