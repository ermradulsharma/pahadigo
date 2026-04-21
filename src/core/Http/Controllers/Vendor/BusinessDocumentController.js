import DocumentService from '@/services/Vendor/DocumentService.js';
import BusinessService from '@/services/Vendor/BusinessService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import Controller from '@/controllers/Controller.js';

/**
 * BusinessDocumentController (Vendor Role) - Specialized management of 
 * business verification files and identity compliance.
 */
class BusinessDocumentController extends Controller {

    // GET /vendor/business/documents
    async getDocuments(req) {
        try {
            const vendor = await BusinessService.getBusinessByUserId(req.user.id);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.DOCUMENTS_FETCHED, vendor.documents);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // POST /vendor/business/documents/upload
    async uploadDocuments(req) {
        try {
            const body = req.payload;
            const result = await DocumentService.uploadVerificationFiles(req.user.id, body);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.DOCUMENTS_UPLOADED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // PATCH /vendor/business/documents/update
    async updateDocument(req) {
        try {
            const body = req.payload;
            const result = await DocumentService.updateDocument(req.user.id, body);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.DOCUMENT_UPDATED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    // DELETE /vendor/business/documents/delete
    async deleteDocument(req) {
        try {
            const body = req.payload;
            const result = await DocumentService.deleteDocument(req.user.id, body.documentId);
            return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.DOCUMENT_DELETED, result);
        } catch (error) {
            return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message);
        }
    }
}

const businessDocumentController = new BusinessDocumentController();
export default businessDocumentController;
