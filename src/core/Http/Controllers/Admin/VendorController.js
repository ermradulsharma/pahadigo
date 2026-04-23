import VendorService from '@/core/Services/Admin/VendorService.js';
import PackageService from '@/core/Services/Admin/PackageService.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Controller from '@/core/Controllers/Controller.js';

/**
 * VendorController (Admin Role)
 * Specialized for administrative management of vendors, approvals, and verification.
 */
class VendorController extends Controller {

  // GET /admin/vendors
  async getVendors(req) {
    try {
      const vendors = await VendorService.getAllVendors();
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, vendors);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/vendors/:id
  async getVendorById(req, { params }) {
    try {
      if (!params.id) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);
      const vendor = await VendorService.getVendorById(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, vendor);
    } catch (error) {
      return this.error(HTTP_STATUS.NOT_FOUND, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // GET /admin/vendors/:id/packages
  async getVendorPackages(req, { params }) {
    try {
      if (!params.id) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);
      const packages = await PackageService.getVendorPackages(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, { packages });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/vendors/create
  async createVendor(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const result = await VendorService.createVendor(body, req);
      return this.success(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.VENDOR.CREATED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // PATCH /admin/vendors/:id/update
  async updateVendor(req, { params }) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      const vendor = await VendorService.updateVendor(params.id, body, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.UPDATED, { vendor });
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // DELETE /admin/vendors/:id/delete
  async deleteVendor(req, { params }) {
    try {
      await VendorService.deleteVendor(params.id);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.DELETED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/approve-vendor
  async approveVendor(req) {
    try {
      const body = req.validData || req.jsonBody || await req.json();
      if (!body.vendorId) return this.error(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.ID_REQUIRED);

      await VendorService.updateVendorStatus(body.vendorId, body.status, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.STATUS_UPDATED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/trigger-ocr
  async verifyDocumentOCR(req) {
    try {
      const data = req.validData || req.jsonBody || await req.json();
      const result = await VendorService.verifyDocumentOCR(data, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.ADMIN.OCR_SUCCESS, result);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/verify-document (Manual Verification)
  async verifyDocument(req) {
    try {
      const data = req.validData || req.jsonBody || await req.json();
      await VendorService.verifyManualDocument(data);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.DOCUMENT_STATUS_UPDATED);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }

  // POST /admin/verify-category-document
  async verifyCategoryDocument(req) {
    try {
      const data = req.validData || req.jsonBody || await req.json();
      const result = await VendorService.verifyCategoryDocument(data, req);
      return this.success(HTTP_STATUS.OK, RESPONSE_MESSAGES.CATEGORY.STATUS_UPDATED, result);
    } catch (error) {
      return this.error(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR);
    }
  }
}

const vendorController = new VendorController();
export default vendorController;
