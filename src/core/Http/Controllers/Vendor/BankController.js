import BusinessService from '@/core/Services/Vendor/BusinessService.js';
import BankService from '@/core/Services/Vendor/BankService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';
import VendorEvents from '@/core/Events/VendorEvents.js';

/**
 * BankController (Vendor Role) - Specialized management of
 * operational payout credentials and secure bank identity.
 */
class BankController extends Controller {

    // GET /vendor/bank/
    async getBankDetails(req) {
        try {
            const vendor = await BusinessService.getBusinessByUserId(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.BANK_FETCHED, vendor.bankDetails);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // POST /vendor/bank/create
    async createBankDetails(req) {
        try {
            const body = req.payload;
            const business = await BusinessService.getBusinessByUserId(req.user.id);

            if (req.formDataBody?.has('cancelledCheque')) {
                body.cancelledChequeFile = req.formDataBody.get('cancelledCheque');
            }
            const vendor = await BankService.syncBankDetails(req.user.id, body);
            if (business?.user?.email) VendorEvents.emit('vendor.bank_added', { identifier: business.user.email, businessName: business?.businessName });
            return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.VENDOR.BANK_CREATED);
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
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.BANK_UPDATED);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // DELETE /vendor/bank/delete
    async deleteBankDetails(req) {
        try {
            const vendor = await BankService.removeBankDetails(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.BANK_DELETED, vendor.bankDetails || {});
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }
}

const bankController = new BankController();
export default bankController;
