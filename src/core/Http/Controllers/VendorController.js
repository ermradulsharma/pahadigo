import VendorService from '@/services/VendorService.js';
import PackageService from '@/services/PackageService.js';
import Vendor from '@/models/Vendor.js';
import { successResponse, errorResponse } from '@/helpers/response.js';
import fs from 'fs';
import path from 'path';
import CategoryService from '@/services/CategoryService.js';
import Category from '@/models/Category.js';
import { HTTP_STATUS, RESPONSE_MESSAGES } from '@/constants/index.js';
import { parseNestedFormData } from '@/helpers/parseNestedFormData.js';
import { uploadToCloudinary } from '@/helpers/cloudinary.js';

class VendorController {

    // --- BUSINESS PROFILE ---

    // GET /vendor/business/profile
    async getBusinessProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const vendor = await VendorService.getFullProfile(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, vendor);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /vendor/business/profile/create (Multipart Form Data)
    async createBusinessProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const formDataBody = req.formDataBody;
            if (!formDataBody) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});

            const parsedData = parseNestedFormData(formDataBody);

            // Explicitly map fields from parsedData to match Vendor schema
            const data = {
                businessName: parsedData.businessName,
                ownerName: parsedData.ownerName,
                businessNumber: parsedData.businessNumber,
                businessRegistration: parsedData.businessRegistration,
                gstNumber: parsedData.gstNumber,
                businessAbout: parsedData.businessAbout,
                businessAddress: {
                    addressLine1: parsedData.businessAddress?.addressLine1 || null,
                    addressLine2: parsedData.businessAddress?.addressLine2 || null,
                    city: parsedData.businessAddress?.city || null,
                    state: parsedData.businessAddress?.state || null,
                    country: parsedData.businessAddress?.country || null,
                    pincode: parsedData.businessAddress?.pincode || null,
                    latitude: parsedData.businessAddress?.latitude || null,
                    longitude: parsedData.businessAddress?.longitude || null,
                    location: {
                        type: 'Point',
                        coordinates: [
                            parseFloat(parsedData.businessAddress?.longitude) || 0,
                            parseFloat(parsedData.businessAddress?.latitude) || 0
                        ]
                    }
                }
            };

            // Basic validation
            if (!data.businessName) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, "Business name is required", {});
            }

            // Handle profile image separately
            const profileImageFile = formDataBody.get('profile_image');
            if (profileImageFile && profileImageFile instanceof File) {
                console.log(`[ProfileCreate] [${user.id}] Uploading profile image to Cloudinary...`);
                const result = await uploadToCloudinary(profileImageFile, `profile/${user.id}`);
                data.profileImage = result.url;
                console.log(`[ProfileCreate] [${user.id}] Profile image uploaded: ${data.profileImage}`);
            }

            // Resolve category slugs from businessCategory
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

            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.PROFILE_CREATED, vendor);
        } catch (error) {
            console.error("Create Profile Error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // PATCH /vendor/business/profile/update (Multipart Form Data)
    async updateBusinessProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const formDataBody = req.formDataBody;
            if (!formDataBody) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});

            const parsedData = parseNestedFormData(formDataBody);
            const data = { ...parsedData };

            // Handle profile image separately
            const profileImageFile = formDataBody.get('profile_image');
            if (profileImageFile && profileImageFile instanceof File) {
                const result = await uploadToCloudinary(profileImageFile, `profile/${user.id}`);
                data.profileImage = result.url;
            }

            // Resolve categories if provided as slugs
            if (data.businessCategory) {
                let categorySlugs = Array.isArray(data.businessCategory) ? data.businessCategory : [data.businessCategory];
                const categories = await Category.find({ slug: { $in: categorySlugs } }).select('_id name slug');
                data.category = categories.map(c => ({ _id: c._id, name: c.name, slug: c.slug }));
                delete data.businessCategory;
            }

            const vendor = await VendorService.upsertProfile(user.id, data);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.PROFILE_UPDATED, vendor);
        } catch (error) {
            console.error("Update Profile Error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // DELETE /vendor/business/profile/delete
    async deleteBusinessProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            await VendorService.deleteProfile(user.id, user.id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }


    // --- BUSINESS DOCUMENTS ---

    // GET /vendor/business/documents
    async getBusinessDocuments(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, vendor);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /vendor/business/documents/upload (Multipart Form Data)
    async uploadBusinessDocuments(req) {
        const startTime = Date.now();
        const user = req.user;
        try {
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const currentVendor = await Vendor.findOne({ user: user.id });
            if (!currentVendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

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
                return errorResponse(HTTP_STATUS.BAD_REQUEST, "No valid files provided in request.", {});
            }

            // Mandatory fields verification (Aadhaar, PAN, etc.)
            const mandatoryFields = ['aadharCard', 'panCard', 'businessRegistration', 'gstRegistration'];
            for (const field of mandatoryFields) {
                const inRequest = documents[field] && (!Array.isArray(documents[field]) || documents[field].length > 0);
                const inDb = currentVendor.documents?.[field] && (!Array.isArray(currentVendor.documents[field]) || currentVendor.documents[field].length > 0);

                if (!inRequest && !inDb) {
                    return errorResponse(HTTP_STATUS.BAD_REQUEST, `Mandatory document missing: ${field}`, {});
                }
            }
            const updatedVendor = await VendorService.upsertProfile(user.id, { documents });
            const duration = Date.now() - startTime;
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.DOCUMENTS_UPLOADED, updatedVendor);
        } catch (error) {
            console.error(`[DocumentUpload] [${user?.id || 'unknown'}] Error:`, error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // PATCH /vendor/business/documents/update
    async updateBusinessDocument(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const formDataBody = req.formDataBody;
            if (!formDataBody) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});

            const { type, id } = parseNestedFormData(formDataBody);
            const file = formDataBody.get('file');

            if (!type || !file) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            console.log(`[DocumentUpdate] [${user.id}] Updating ${type}...`);
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
                { new: true, arrayFilters }
            );

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, updatedVendor);
        } catch (error) {
            console.error("Update Document Error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // DELETE /vendor/business/documents/delete
    async deleteBusinessDocument(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

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
                { new: true }
            );

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, updatedVendor);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }


    // --- BANK DETAILS ---

    // GET /vendor/bank
    async getBankDetails(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, vendor);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /vendor/bank/create (Multipart Form Data)
    async createBankDetails(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

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
                    const errorMsg = `Required fields missing: ${missing.join(', ')}${!hasCheque ? ', cancelledCheque' : ''}`;
                    return errorResponse(HTTP_STATUS.BAD_REQUEST, errorMsg, {});
                }
            }
            const updatedVendor = await VendorService.upsertProfile(user.id, { bankDetails: bankData });
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.BANK_DETAILS_SAVED, updatedVendor);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
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
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const updatedVendor = await VendorService.deleteBankDetails(user.id);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, updatedVendor);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }


    // --- PACKAGES ---

    // GET /vendor/packages -> Returns the Single Catalog
    async getPackages(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const packages = await VendorService.findByUserId(user.id);
            if (!packages) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            // Get Catalog
            const catalog = await PackageService.getVendorCatalog(packages._id);

            // Filter services based on Vendor Profile Categories
            // Map Profile Category Strings to Schema Keys
            const categoryMap = {
                'Homestay': 'homestay',
                'Hotel': 'homestay', // Fallback
                'Camping': 'camping',
                'Trekking': 'trekking',
                'Rafting': 'rafting',
                'River Rafting': 'rafting',
                'Bungee Jumping': 'bungeeJumping',
                'Bike/Car Rental': 'vehicleRental',
                'Chardham Tour': 'chardhamTour'
            };

            const allowedServices = packages.category.map(c => categoryMap[c.name]).filter(Boolean);

            // Convert to Object to filter
            const catalogObj = catalog.toObject();
            const filteredServices = {};

            allowedServices.forEach(key => {
                if (catalogObj.services[key]) {
                    filteredServices[key] = catalogObj.services[key];
                }
            });

            // Return filtered view
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, {
                catalog: {
                    ...catalogObj,
                    services: filteredServices
                }
            });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /vendor/create-package
    async createPackage(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.VENDOR_INCOMPLETE, {});

            const body = req.jsonBody || await req.json();
            const { title, price } = body;

            if (!title || !price) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const newPackage = await PackageService.createPackage(vendor._id, body);

            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.PACKAGE_CREATED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /vendor/package/add-item -> Add Service Item
    async addItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            let category, item;
            if (req.formDataBody) {
                const parsed = parseNestedFormData(req.formDataBody);
                category = parsed.category;
                const rawItems = Array.isArray(parsed.item) ? parsed.item : [parsed.item];
                item = await this._processItemData(user, category, rawItems[0]);
            } else {
                const body = req.jsonBody || await req.json();
                category = body.category;
                item = await this._processItemData(user, category, body.item);
            }

            if (!category || !item) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            const updatedCatalog = await PackageService.addServiceItem(vendor._id, category, item);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.ITEM_ADDED, { catalog: updatedCatalog });
        } catch (error) {
            console.error("Add Item Error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // PATCH /vendor/package/update-item
    async updateItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            let category, itemId, updates;
            if (req.formDataBody) {
                const parsed = parseNestedFormData(req.formDataBody);
                category = parsed.category;
                itemId = parsed.itemId;
                updates = await this._processItemData(user, category, parsed.updates);
            } else {
                const body = req.jsonBody || await req.json();
                category = body.category;
                itemId = body.itemId;
                updates = await this._processItemData(user, category, body.updates);
            }

            if (!category || !itemId || !updates) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            const updatedCatalog = await PackageService.updateServiceItem(vendor._id, category, itemId, updates);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, { catalog: updatedCatalog });
        } catch (error) {
            console.error("Update Item Error:", error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // DELETE /vendor/package/delete-item
    async deleteItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            const body = req.jsonBody || await req.json();
            const { category, itemId } = body;
            if (!category || !itemId) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            const updatedCatalog = await PackageService.removeServiceItem(vendor._id, category, itemId);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, { catalog: updatedCatalog });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /vendor/package/toggle-item
    async toggleItemStatus(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            const body = req.jsonBody || await req.json();
            const { category, itemId, isActive } = body;
            if (!category || !itemId || typeof isActive !== 'boolean') return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            const updatedCatalog = await PackageService.toggleItemStatus(vendor._id, category, itemId, isActive);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, { catalog: updatedCatalog });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /vendor/package/toggle-category
    async toggleCategoryStatus(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            const body = req.jsonBody || await req.json();
            const { category, isActive } = body;
            if (!category || typeof isActive !== 'boolean') return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            const updatedCatalog = await PackageService.toggleCategoryStatus(vendor._id, category, isActive);
            return successResponse(HTTP_STATUS.OK, `Category ${category} status updated`, { catalog: updatedCatalog });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }


    // --- LEGACY / INTERNAL ---

    // GET /vendor/business/categories
    async getBusinessCategories(req) {
        const categories = await CategoryService.getAllCategories();
        return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { categories });
    }

    async addBusinessCategory(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const { categorySlug } = req.jsonBody || await req.json();
            if (!categorySlug) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            const category = await Category.findOne({ slug: categorySlug }).select('_id name slug');
            if (!category) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.CATEGORY_NOT_FOUND, {});

            const updatedVendor = await VendorService.addCategory(user.id, {
                _id: category._id,
                name: category.name,
                slug: category.slug
            });

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, updatedVendor);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    async removeBusinessCategory(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const { categorySlug } = req.jsonBody || await req.json();
            if (!categorySlug) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            const updatedVendor = await VendorService.removeCategory(user.id, categorySlug);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, updatedVendor);
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // Helper to process item data (handle files and map to schema)
    async _processItemData(user, category, item) {
        if (!item) return null;

        const photoUrls = [];
        if (item.photos && Array.isArray(item.photos)) {
            for (const photo of item.photos) {
                if (photo instanceof File) {
                    console.log(`[PackageItem] [${user.id}] Uploading photo to Cloudinary...`);
                    const result = await uploadToCloudinary(photo, `packages/${user.id}/${category || 'general'}`);
                    photoUrls.push({ url: result.url, type: 'image', publicId: result.publicId });
                } else if (typeof photo === 'string') {
                    photoUrls.push({ url: photo, type: 'image' });
                } else if (photo && photo.url) {
                    photoUrls.push(photo);
                }
            }
            item.photos = photoUrls;
        }

        if (item.amenities && Array.isArray(item.amenities)) {
            item.amenities = item.amenities.map(a =>
                typeof a === 'string' ? { title: a } : a
            );
        }

        return item;
    }
}

const vendorController = new VendorController();
export default vendorController;