import VendorService from '@/services/VendorService.js';
import PackageService from '@/services/PackageService.js';
import Vendor from '@/models/Vendor.js';
import User from '@/models/User.js';
import AuthService from '@/services/AuthService.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import { CATEGORY_MAP } from '@/constants/categories.js';
import fs from 'fs';
import path from 'path';
import CategoryService from '@/services/CategoryService.js';
import Category from '@/models/Category.js';
import { HTTP_STATUS, RESPONSE_MESSAGES, PACKAGE } from '@/constants/index.js';
import { parseNestedFormData } from '@/helpers/parseNestedFormData.js';
import { uploadToCloudinary } from '@/helpers/cloudinary.js';
import BookingService from '@/services/BookingService.js';
import Package from '@/models/Package.js';
import VendorDocument from '@/models/VendorDocument.js';
import CategoryDocument from '@/models/CategoryDocument.js';
import { mapToGeoJSON } from '@/helpers/geoUtils.js';

class VendorController {

  // --- BUSINESS PROFILE ---

  // GET /vendor/business/profile
  async getBusinessProfile(req) {
    try {
      const user = req.user;
      if (!user || user.role !== 'vendor') {
        return errorResponse(HTTP_STATUS.FORBIDDEN, 'Only vendors can access this profile', {});
      }
      const vendor = await VendorService.getFullProfile(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, vendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/business/profile/create (Multipart Form Data)
  async createBusinessProfile(req) {
    try {
      const user = req.user;
      const formDataBody = req.formDataBody;
      if (!formDataBody) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});
      const parsedData = parseNestedFormData(formDataBody);
      const data = {
        profileType: parsedData.profileType,
        ownerName: parsedData.ownerName,
        ...(parsedData.profileType === 'business' && {
          businessName: parsedData.businessName,
          businessNumber: parsedData.businessNumber,
          businessRegistration: parsedData.businessRegistration,
          gstNumber: parsedData.gstNumber,
          businessAbout: parsedData.businessAbout,
        }),
        ...(parsedData.profileType === 'individual' && {
          personalNumber: parsedData.personalNumber,
          personalPanCard: parsedData.personalPanCard,
          personalAbout: parsedData.personalAbout,
        }),
        address: {
          addressLine1: parsedData.address?.addressLine1 || null,
          addressLine2: parsedData.address?.addressLine2 || null,
          city: parsedData.address?.city || null,
          state: parsedData.address?.state || null,
          country: parsedData.address?.country || null,
          pincode: parsedData.address?.pincode || null,
          latitude: parsedData.address?.latitude || null,
          longitude: parsedData.address?.longitude || null
        }
      };
      mapToGeoJSON(data.address, 'location');
      if (data.profileType === 'business' && !data.businessName) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
      }
      if (data.profileType === 'individual' && !data.ownerName) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
      }
      const profileImageFile = formDataBody.get('profile_image');
      if (profileImageFile && profileImageFile instanceof File) {
        const result = await uploadToCloudinary(profileImageFile, `profile/${user.id}`);
        data.profileImage = result.url;
      }
      let categorySlugs = parsedData.businessCategory;
      if (categorySlugs) {
        if (!Array.isArray(categorySlugs)) {
          categorySlugs = [categorySlugs];
        }

        if (categorySlugs.length > 0) {
          const categories = await Category.find({ slug: { $in: categorySlugs } }).select('_id name slug');
          data.category = categories.map(c => ({
            _id: c._id,
            name: c.name,
            slug: c.slug
          }));
        }
      }

      const vendor = await VendorService.upsertProfile(user.id, data);
      const fullUser = await User.findById(user.id);
      const vendorData = await AuthService._getVendorStatus(fullUser);
      const userObj = fullUser.toObject();
      const authHeader = req.headers.get('authorization');
      const token = authHeader ? authHeader.split(' ')[1] : null;
      const responsePayload = {
        ...userObj,
        password: undefined,
        token,
        isNewUser: false,
        businessProfileStatus: vendorData.businessProfileStatus,
        businessProfile: {
          ...(vendor.toObject ? vendor.toObject() : vendor),
          user: userObj._id
        }
      };

      return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS, responsePayload);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // PATCH /vendor/business/profile/update (Multipart Form Data)
  async updateBusinessProfile(req) {
    try {
      const user = req.user;
      const formDataBody = req.formDataBody;
      if (!formDataBody) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});
      const parsedData = parseNestedFormData(formDataBody);
      const data = { ...parsedData };
      const profileImageFile = formDataBody.get('profile_image');
      if (profileImageFile && profileImageFile instanceof File) {
        const result = await uploadToCloudinary(profileImageFile, `profile/${user.id}`);
        data.profileImage = result.url;
      }
      if (data.businessCategory) {
        let categorySlugs = Array.isArray(data.businessCategory) ? data.businessCategory : [data.businessCategory];
        const categories = await Category.find({ slug: { $in: categorySlugs } }).select('_id name slug');
        data.category = categories.map(c => ({ _id: c._id, name: c.name, slug: c.slug }));
        delete data.businessCategory;
      }
      const vendor = await VendorService.upsertProfile(user.id, data);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.PROFILE_UPDATED, vendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // DELETE /vendor/business/profile/delete
  async deleteBusinessProfile(req) {
    try {
      const user = req.user;
      await VendorService.deleteProfile(user.id, user.id);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, {});
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // GET /vendor/business/documents
  async getBusinessDocuments(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.VENDOR.FETCHED, vendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/business/documents/upload (Multipart Form Data)
  async uploadBusinessDocuments(req) {
    const startTime = Date.now();
    const user = req.user;
    try {
      const currentVendor = await Vendor.findOne({ user: user.id });
      if (!currentVendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      const formDataBody = req.formDataBody;
      if (!formDataBody) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});

      // Use helper to parse nested structures (e.g., aadharCard[0])
      const parsedData = parseNestedFormData(formDataBody);
      const documents = {};

      const processField = async (fieldKey, value) => {
        const isArray = Array.isArray(value);
        const files = isArray ? value : [value];
        const results = [];

        for (const file of files) {
          if (file instanceof File || (file instanceof Blob && file.name)) {
            const result = await uploadToCloudinary(file, `documents/${user.id}/${fieldKey}`);

            const docObject = {
              url: result.url,
              publicId: result.publicId,
              status: 'pending',
              reason: null
            };

            results.push(docObject);
          }
        }

        if (results.length > 0) {
          if (['panCard', 'businessRegistration', 'gstRegistration'].includes(fieldKey)) {
            documents[fieldKey] = results[0];
          } else {
            documents[fieldKey] = results;
          }
        }
      };
      await Promise.all(Object.entries(parsedData).map(([key, val]) => processField(key, val)));

      if (Object.keys(documents).length === 0) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.INVALID_DATA, {});
      }

      // Mandatory fields verification (Aadhaar, PAN, etc.)
      const mandatoryFields = ['aadharCard', 'panCard', 'businessRegistration', 'gstRegistration'];
      for (const field of mandatoryFields) {
        const inRequest = documents[field] && (!Array.isArray(documents[field]) || documents[field].length > 0);
        const inDb = currentVendor.documents?.[field] && (!Array.isArray(currentVendor.documents[field]) || currentVendor.documents[field].length > 0);

        if (!inRequest && !inDb) {
          return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
        }
      }
      const updatedVendor = await VendorService.upsertProfile(user.id, { documents });
      const duration = Date.now() - startTime;
      return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.VENDOR.DOCUMENTS_UPLOADED, updatedVendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // PATCH /vendor/business/documents/update
  async updateBusinessDocument(req) {
    try {
      const user = req.user;
      const formDataBody = req.formDataBody;
      if (!formDataBody) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});

      const { type, id } = parseNestedFormData(formDataBody);
      const file = formDataBody.get('file');

      if (!type || !file) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      const result = await uploadToCloudinary(file, `documents/${user.id}/${type}`);

      const docObject = {
        url: result.url,
        publicId: result.publicId,
        status: 'pending',
        reason: null
      };

      const update = {};
      if (type === 'aadharCard' && id) {
        update['$set'] = { 'documents.aadharCard.$[elem]': docObject };
        var arrayFilters = [{ 'elem._id': id }];
      } else {
        update['$set'] = { [`documents.${type}`]: docObject };
      }

      const updatedVendor = await Vendor.findOneAndUpdate(
        { user: user.id },
        update,
        { returnDocument: 'after', arrayFilters }
      );

      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, updatedVendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // DELETE /vendor/business/documents/delete
  async deleteBusinessDocument(req) {
    try {
      const user = req.user;
      const { type, id } = req.jsonBody || await req.json();
      if (!type) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      const update = {};
      if (type === 'aadharCard' && id) {
        update['$pull'] = { 'documents.aadharCard': { _id: id } };
      } else {
        update['$set'] = { [`documents.${type}`]: null };
      }

      const updatedVendor = await Vendor.findOneAndUpdate(
        { user: user.id },
        update,
        { returnDocument: 'after' }
      );

      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, updatedVendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }


  // --- BANK DETAILS ---

  // GET /vendor/bank
  async getBankDetails(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, vendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/bank/create (Multipart Form Data)
  async createBankDetails(req) {
    try {
      const user = req.user;
      const formDataBody = req.formDataBody;
      if (!formDataBody) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});
      const parsedData = parseNestedFormData(formDataBody);

      // Build bankData dynamically to allow partial updates (skip undefined)
      const bankData = {};
      ['accountHolderName', 'accountNumber', 'ifscCode', 'bankName'].forEach(key => {
        if (parsedData[key] !== undefined) bankData[key] = parsedData[key];
      });

      const cancelledChequeFile = formDataBody.get('cancelledCheque') || formDataBody.get('cancelChequered');
      if (cancelledChequeFile && cancelledChequeFile instanceof File) {
        const result = await uploadToCloudinary(cancelledChequeFile, `bank/${user.id}`);
        bankData.cancelledCheque = {
          url: result.url,
          publicId: result.publicId,
          status: 'pending'
        };
      }

      const vendor = await Vendor.findOne({ user: user.id });
      const isNewBankEntry = !vendor || !vendor.bankDetails || !vendor.bankDetails.accountNumber;

      if (isNewBankEntry) {
        const required = ['accountHolderName', 'accountNumber', 'ifscCode', 'bankName'];
        const missing = required.filter(f => !bankData[f]);
        const hasCheque = bankData.cancelledCheque || (vendor?.bankDetails?.cancelledCheque?.url);

        if (missing.length > 0 || !hasCheque) {
          const errorMsg = RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS;
          return errorResponse(HTTP_STATUS.BAD_REQUEST, errorMsg, {});
        }
      }
      const updatedVendor = await VendorService.upsertProfile(user.id, { bankDetails: bankData });
      return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.VENDOR.BANK_DETAILS_UPDATED, updatedVendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // PATCH /vendor/bank/update
  async updateBankDetails(req) {
    return this.createBankDetails(req);
  }

  // DELETE /vendor/bank/delete
  async deleteBankDetails(req) {
    try {
      const user = req.user;
      const updatedVendor = await VendorService.deleteBankDetails(user.id);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, updatedVendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }


  // --- PACKAGES ---

  // GET /vendor/packages -> Returns the Single Catalog
  async getPackages(req) {
    try {
      const user = req.user;
      const packages = await VendorService.findByUserId(user.id);
      if (!packages) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      const catalog = await PackageService.getFormattedVendorCatalog(packages._id);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, catalog);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/create-package
  async createPackage(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.INCOMPLETE, {});

      const body = req.jsonBody || await req.json();
      const { title, price } = body;

      if (!title || !price) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
      }

      const newPackage = await PackageService.createPackage(vendor._id, body);

      return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.PACKAGE.CREATED, {});
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/package/add-item -> Add Service Item
  async addItem(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      let category, item;
      if (req.formDataBody) {
        const parsed = parseNestedFormData(req.formDataBody);
        category = this._normalizeCategory(parsed.category);

        // Postman often sends item[0][field], which parseNestedFormData might
        // return as an array in parsed.item. If so, take the first element.
        const rawItem = Array.isArray(parsed.item) ? parsed.item[0] : parsed.item;
        item = await this._processItemData(user, category, rawItem);
      } else {
        const body = req.jsonBody || await req.json();
        category = this._normalizeCategory(body.category);
        const rawItem = Array.isArray(body.item) ? body.item[0] : body.item;
        item = await this._processItemData(user, category, rawItem);
      }

      if (!category || !item) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      await PackageService.addServiceItem(vendor._id, category, item);
      const catalog = await PackageService.getFormattedVendorCatalog(vendor._id);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.ITEM.ADDED, catalog);
    } catch (error) {
      const status = error.message && (error.message.includes('not authorized') || error.message.includes('Invalid category')) ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return errorResponse(status, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // GET /vendor/package/item/:category/:itemId
  async getItem(req, { params }) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      const p = await params;
      let category = p.category;
      const itemId = p.itemId;

      category = this._normalizeCategory(category);
      if (!category || !itemId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      const catalog = await PackageService.ensureCatalog(vendor._id);

      if (!catalog || !catalog[category]) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid category", {});
      }

      const item = catalog[category].id(itemId);
      if (!item) return errorResponse(HTTP_STATUS.NOT_FOUND, "Item not found", {});

      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, item);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // PATCH /vendor/package/update-item
  async updateItem(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      let category, itemId, updates;
      if (req.formDataBody) {
        const parsed = parseNestedFormData(req.formDataBody);
        category = this._normalizeCategory(parsed.category);
        itemId = parsed.itemId;
        const rawItem = parsed.updates || (Array.isArray(parsed.item) ? parsed.item[0] : parsed.item);
        updates = await this._processItemData(user, category, rawItem);
      } else {
        const body = req.jsonBody || await req.json();
        category = this._normalizeCategory(body.category);
        itemId = body.itemId;
        const rawItem = body.updates || (Array.isArray(body.item) ? body.item[0] : body.item);
        updates = await this._processItemData(user, category, rawItem);
      }

      if (!category || !itemId || !updates) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      await PackageService.updateServiceItem(vendor._id, category, itemId, updates);
      const catalog = await PackageService.getFormattedVendorCatalog(vendor._id);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, catalog);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // DELETE /vendor/package/delete-item
  async deleteItem(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      let category, itemId;
      if (req.formDataBody) {
        category = req.formDataBody.get('category');
        itemId = req.formDataBody.get('itemId');
      } else {
        const body = req.jsonBody || await req.json();
        category = body.category;
        itemId = body.itemId;
      }

      category = this._normalizeCategory(category);
      if (!category || !itemId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      await PackageService.removeServiceItem(vendor._id, category, itemId);
      const catalog = await PackageService.getFormattedVendorCatalog(vendor._id);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETED, catalog);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/package/toggle-item
  async toggleItemStatus(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      let category, itemId, isActive;

      if (req.formDataBody) {
        category = req.formDataBody.get('category');
        itemId = req.formDataBody.get('itemId');
        if (req.formDataBody.has('isActive')) {
          const activeVal = req.formDataBody.get('isActive');
          isActive = typeof activeVal === 'string' ? activeVal.trim().toLowerCase() === 'true' : !!activeVal;
        }
      } else {
        const body = req.jsonBody || await req.json();
        category = body.category;
        itemId = body.itemId;
        if (body.isActive !== undefined) {
          isActive = typeof body.isActive === 'string' ? body.isActive.trim().toLowerCase() === 'true' : !!body.isActive;
        }
      }

      category = this._normalizeCategory(category);
      if (!category || !itemId || typeof isActive !== 'boolean') return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      await PackageService.toggleItemStatus(vendor._id, category, itemId, isActive);
      const catalog = await PackageService.getFormattedVendorCatalog(vendor._id);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, catalog);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/package/toggle-category
  async toggleCategoryStatus(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});
      let category, isActive;
      if (req.formDataBody) {
        category = req.formDataBody.get('category');
        if (req.formDataBody.has('isActive')) {
          const activeVal = req.formDataBody.get('isActive');
          isActive = typeof activeVal === 'string' ? activeVal.trim().toLowerCase() === 'true' : !!activeVal;
        }
      } else {
        const body = req.jsonBody || await req.json();
        category = body.category;
        if (body.isActive !== undefined) {
          isActive = typeof body.isActive === 'string' ? body.isActive.trim().toLowerCase() === 'true' : !!body.isActive;
        }
      }

      category = this._normalizeCategory(category);
      if (!category || typeof isActive !== 'boolean') return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      await PackageService.toggleCategoryStatus(vendor._id, category, isActive);
      const catalog = await PackageService.getFormattedVendorCatalog(vendor._id);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, catalog);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }


  // --- VENDOR BOOKINGS & TIMELINE ---

  // GET /vendor/bookings
  async getBookings(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      const bookings = await BookingService.getVendorBookings(vendor._id);

      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, bookings);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/bookings/:id/timeline
  async addTimelineEvent(req, { params }) {
    try {
      const user = req.user;
      const { id: bookingId } = params;

      const body = req.jsonBody || await req.json();
      const { title, description } = body;

      if (!title) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      // Security: Ensure booking belongs to this vendor
      const vendor = await VendorService.findByUserId(user.id);
      const booking = await BookingService.getBookingById(bookingId);

      if (!booking) return errorResponse(HTTP_STATUS.NOT_FOUND, 'Booking not found', {});

      // Check if vendor owns the package
      const catalog = await Package.findOne({ vendor: vendor._id });
      if (!catalog || booking.package?.toString() !== catalog._id.toString()) {
        if (booking.package?._id?.toString() !== catalog?._id?.toString()) {
          return errorResponse(HTTP_STATUS.FORBIDDEN, 'You do not have permission to update this booking.', {});
        }
      }

      const updatedTimeline = await BookingService.addTimelineEvent(bookingId, title, description, user.id);

      return successResponse(HTTP_STATUS.OK, 'Timeline updated successfully', updatedTimeline);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }


  // Legacy / Test compatibility
  async getBusinessCategories(req) {
     return this.getVendorCategories(req);
  }

  // GET /vendor/categories
  async getVendorCategories(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      const categories = vendor.category || [];
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, categories);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/category-documents
  async getCategoryDocumentsBySlug(req) {
    try {
      let slug;
      if (req.formDataBody) {
        slug = req.formDataBody.get('slug') || req.formDataBody.get('category_slug');
      } else {
        const body = req.jsonBody || await req.json();
        slug = body.slug || body.category_slug;
      }

      if (!slug) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      const documents = await CategoryDocument.find({ category_slug: slug, isActive: true })
        .select('name slug isMandatory');

      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCHED, documents);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // POST /vendor/category-documents/upload (Multipart Form Data)
  async uploadCategoryDocument(req) {
    try {
      const user = req.user;
      const vendor = await VendorService.findByUserId(user.id);
      if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.VENDOR.NOT_FOUND, {});

      const formDataBody = req.formDataBody;
      if (!formDataBody) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});

      const uploadPromises = [];

      const parsedData = parseNestedFormData(formDataBody);

      // 1. Support user's exact requested array format: document_slug[0], image[0]
      if (parsedData.document_slug && (parsedData.image || parsedData.file)) {
        // Ensure they are arrays
        const docSlugs = Array.isArray(parsedData.document_slug) ? parsedData.document_slug : [parsedData.document_slug];
        const rawFiles = parsedData.image || parsedData.file;
        const files = Array.isArray(rawFiles) ? rawFiles : [rawFiles];

        // The category the user explicitly provided for this batch
        const explicitCatSlug = parsedData.category_slug || parsedData.slug;

        if (!explicitCatSlug) return errorResponse(HTTP_STATUS.BAD_REQUEST, "category_slug is required.", {});

        for (let i = 0; i < docSlugs.length; i++) {
          const docSlug = docSlugs[i];
          const fileObj = files[i];

          if (fileObj && ((fileObj instanceof File) || (fileObj instanceof Blob && fileObj.name))) {
            uploadPromises.push(
              uploadToCloudinary(fileObj, `vendor-documents/${vendor._id}/${explicitCatSlug}`).then(result => {
                const filter = { vendor_id: vendor._id, document_slug: docSlug, category_slug: explicitCatSlug };
                const update = { url: result.url, status: 'pending' };
                return VendorDocument.findOneAndUpdate(filter, update, { returnDocument: 'after', upsert: true });
              })
            );
          }
        }
      } else if (parsedData.documents && typeof parsedData.documents === 'object') {
        // 2. Try nested structure: documents[category_slug][document_slug] = File
        for (const [catSlug, docsObj] of Object.entries(parsedData.documents)) {
          for (const [docSlug, fileOrFiles] of Object.entries(docsObj)) {
            const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
            for (const f of files) {
              if ((f instanceof File) || (f instanceof Blob && f.name)) {
                uploadPromises.push(
                  uploadToCloudinary(f, `vendor-documents/${vendor._id}/${catSlug}`).then(result => {
                    const filter = { vendor_id: vendor._id, document_slug: docSlug, category_slug: catSlug };
                    const update = { url: result.url, status: 'pending' };
                    return VendorDocument.findOneAndUpdate(filter, update, { returnDocument: 'after', upsert: true });
                  })
                );
              }
            }
          }
        }
      } else {
        // Fallback to ultimate flat simple category logic
        const entries = Array.from(formDataBody.entries());

        // 1. Backward compatibility for single upload where document_slug and category_slug are explicit
        const explicitDocSlug = formDataBody.get('document_slug');
        const explicitCatSlug = formDataBody.get('category_slug') || formDataBody.get('slug');

        if (explicitDocSlug && typeof explicitDocSlug === 'string' && explicitCatSlug) {
          const singleFile = formDataBody.get('file') || formDataBody.get('image');
          if ((singleFile instanceof File) || (singleFile instanceof Blob && singleFile.name)) {
            uploadPromises.push(
              uploadToCloudinary(singleFile, `vendor-documents/${vendor._id}/${explicitCatSlug}`).then(result => {
                const filter = { vendor_id: vendor._id, document_slug: explicitDocSlug, category_slug: explicitCatSlug };
                const update = { url: result.url, status: 'pending' };
                return VendorDocument.findOneAndUpdate(filter, update, { returnDocument: 'after', upsert: true });
              })
            );
          }
        }

        // 2. Map all files dynamically where key = document_slug. We automatically find its category!
        for (const [key, value] of entries) {
          if (key === 'file' || key === 'image' || key === 'document_slug' || key === 'category_slug' || key === 'slug') continue;

          if ((value instanceof File) || (value instanceof Blob && value.name)) {
            // Look up the category this document array belongs to
            const docDef = await CategoryDocument.findOne({ slug: key });
            // fallback to explicitCatSlug if it's missing in DB (unlikely unless deleted)
            const finalCatSlug = docDef ? docDef.category_slug : explicitCatSlug;

            if (finalCatSlug) {
              uploadPromises.push(
                uploadToCloudinary(value, `vendor-documents/${vendor._id}/${finalCatSlug}`).then(result => {
                  const filter = { vendor_id: vendor._id, document_slug: key, category_slug: finalCatSlug };
                  const update = { url: result.url, status: 'pending' };
                  return VendorDocument.findOneAndUpdate(filter, update, { returnDocument: 'after', upsert: true });
                })
              );
            }
          }
        }
      }

      if (uploadPromises.length === 0) {
        return errorResponse(HTTP_STATUS.BAD_REQUEST, "No valid files provided.", {});
      }

      const uploadedDocs = await Promise.all(uploadPromises);
      return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.CREATED, uploadedDocs);
    } catch (error) {
      console.error("Upload Category Document Error:", error);
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async addBusinessCategory(req) {
    try {
      const user = req.user;
      const { categorySlug } = req.jsonBody || await req.json();
      if (!categorySlug) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      const category = await Category.findOne({ slug: categorySlug }).select('_id name slug');
      if (!category) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.CATEGORY.NOT_FOUND, {});

      const updatedVendor = await VendorService.addCategory(user.id, {
        _id: category._id,
        name: category.name,
        slug: category.slug
      });

      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, updatedVendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  async removeBusinessCategory(req) {
    try {
      const user = req.user;
      const { categorySlug } = req.jsonBody || await req.json();
      if (!categorySlug) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

      const updatedVendor = await VendorService.removeCategory(user.id, categorySlug);
      return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATED, updatedVendor);
    } catch (error) {
      return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.SERVER_ERROR, {});
    }
  }

  // Helper to process item data (handle files and map to schema)
  async _processItemData(user, category, item) {
    if (!item) return null;

    // Normalize Enum Values
    const ENUM_MAPS = {
      roomType: PACKAGE.ACCOMMODATION.ROOM_TYPES,
      bedType: PACKAGE.ACCOMMODATION.BED_TYPES,
      bathroomType: PACKAGE.ACCOMMODATION.BATHROOM_TYPES,
      view: PACKAGE.ACCOMMODATION.VIEW_TYPES,
      mealType: PACKAGE.ACCOMMODATION.MEAL_TYPES,
      campingType: PACKAGE.ACTIVITY.CAMPING_TYPES,
      difficultyLevel: PACKAGE.DIFFICULTY,
      bestSeason: PACKAGE.SEASONS,
      rapidGrade: PACKAGE.ACTIVITY.RAPID_GRADES,
      vehicleType: PACKAGE.TRANSPORT.VEHICLE_TYPES,
      fuelPolicy: PACKAGE.TRANSPORT.FUEL_POLICIES,
      transmission: PACKAGE.TRANSPORT.TRANSMISSION_TYPES,
      hotelType: PACKAGE.ACCOMMODATION.HOTEL_TYPES
    };

    const normalizeValue = (val, mapObj) => {
      if (typeof val !== 'string') return val;
      const trimmed = val.trim();
      const validValues = Object.values(mapObj);

      // 1. Direct match (Case-sensitive)
      if (validValues.includes(trimmed)) return trimmed;

      // 2. Case-insensitive match
      const ciMatch = validValues.find(v => v.toLowerCase() === trimmed.toLowerCase());
      if (ciMatch) return ciMatch;

      // 3. Mapping based on common keys
      const upperKey = trimmed.toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');

      // Handle specific legacy/short mappings
      if (upperKey === 'BREAKFAST') return mapObj['BREAKFAST_ONLY'] || trimmed;
      if (upperKey === 'NO_MEALS') return mapObj['NO_MEALS'] || 'No Meals Included';

      return mapObj[upperKey] || trimmed;
    };

    Object.keys(ENUM_MAPS).forEach(key => {
      if (item[key] !== undefined) {
        item[key] = normalizeValue(item[key], ENUM_MAPS[key]);
      }
      ['roomDetails', 'vehicleDetails', 'details'].forEach(subKey => {
        if (item[subKey] && item[subKey][key] !== undefined) {
          item[subKey][key] = normalizeValue(item[subKey][key], ENUM_MAPS[key]);
        }
      });
    });

    const photoUrls = [];
    if (item.photos && Array.isArray(item.photos)) {
      for (const photo of item.photos) {
        if (photo instanceof File || (photo instanceof Blob && photo.name)) {
          const result = await uploadToCloudinary(photo, `packages/${user.id}/${category || 'general'}`);
          photoUrls.push({ url: result.url, type: 'image', publicId: result.publicId });
        } else if (typeof photo === 'string' && photo.length > 0) {
          // Handle direct string URLs (like Postman cloud URLs or existing links)
          photoUrls.push({ url: photo, type: 'image' });
        } else if (photo && photo.url) {
          photoUrls.push(photo);
        }
      }
      item.photos = photoUrls;
    }

    if (item.amenities && Array.isArray(item.amenities)) {
      // Keep it as a string instead of mapping to object, as new schema expects String
      item.amenities = item.amenities.join(', ');
    }

    // Map latitude and longitude to GeoJSON coordinates using Helper
    mapToGeoJSON(item.location);
    if (item.details) {
      mapToGeoJSON(item.details.startPoint);
      mapToGeoJSON(item.details.endPoint);
    }

    return item;
  }

  _normalizeCategory(category) {
    if (!category) return null;
    const trimmed = category.trim().toLowerCase();
    return CATEGORY_MAP[trimmed] || trimmed;
  }
}

const vendorController = new VendorController();
export default vendorController;
