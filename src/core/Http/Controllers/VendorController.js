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

    // POST /vendor/profile/create (Multipart Form Data)
    async createProfile(req) {
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

    // POST /vendor/document/upload (Multipart Form Data)
    async uploadDocuments(req) {
        const startTime = Date.now();
        const user = req.user;
        try {
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            console.log(`[DocumentUpload] [${user.id}] Request received at ${new Date().toISOString()}`);

            const currentVendor = await Vendor.findOne({ user: user.id });
            console.log(`[DocumentUpload] [${user.id}] Vendor found in DB`);

            const formData = req.formDataBody;
            if (!formData) {
                console.log(`[DocumentUpload] [${user.id}] Error: No form data`);
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});
            }

            const baseUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents', user.id);
            const documents = {};
            const handledDeletions = new Set();

            const deleteOldFile = async (relativeUrl) => {
                if (!relativeUrl) return;
                // Note: Deleting from Cloudinary would require the public_id.
                // For now, we'll focus on uploading. Deletion can be implemented later if needed.
                console.log(`[DocumentUpload] [${user.id}] Skipping deletion of old file (Cloudinary migration in progress): ${relativeUrl}`);
            };

            const processFile = async (key, value) => {
                // Check if value is a string instead of a File
                if (typeof value === 'string') {
                    console.warn(`[DocumentUpload] [${user.id}] WARNING: Field ${key} received as string, not File. Value prefix: ${value.substring(0, 50)}`);
                    return;
                }

                if (!(value instanceof File || (value instanceof Blob && value.name))) {
                    console.warn(`[DocumentUpload] [${user.id}] Skipping non-file field: ${key}`);
                    return;
                }

                let targetField = key;
                const arrayMatch = key.match(/^(.+)\[\d+\]$/);
                if (arrayMatch) {
                    targetField = arrayMatch[1];
                }

                console.log(`[DocumentUpload] [${user.id}] Processing file: ${key} (Field: ${targetField})`);

                // Delete old files for this field (once per field)
                if (currentVendor?.documents && !handledDeletions.has(targetField)) {
                    handledDeletions.add(targetField);
                    const oldDoc = currentVendor.documents[targetField];
                    if (oldDoc) {
                        console.log(`[DocumentUpload] [${user.id}] Cleaning up old docs for ${targetField}`);
                        if (Array.isArray(oldDoc)) {
                            await Promise.all(oldDoc.map(doc => deleteOldFile(doc.url)));
                        } else if (oldDoc.url) {
                            await deleteOldFile(oldDoc.url);
                        }
                    }
                }

                console.log(`[DocumentUpload] [${user.id}] Uploading ${key} to Cloudinary...`);
                const result = await uploadToCloudinary(value, `documents/${user.id}/${targetField}`);

                const docObject = {
                    url: result.url,
                    status: 'pending',
                    reason: null,
                    publicId: result.publicId
                };

                if (['panCard', 'businessRegistration', 'gstRegistration'].includes(targetField)) {
                    documents[targetField] = docObject;
                } else {
                    if (!documents[targetField]) documents[targetField] = [];
                    documents[targetField].push(docObject);
                }
                console.log(`[DocumentUpload] [${user.id}] File ${key} complete`);
            };

            const entries = Array.from(formData.entries());
            console.log(`[DocumentUpload] [${user.id}] Starting parallel processing of ${entries.length} entries`);
            await Promise.all(entries.map(([key, value]) => processFile(key, value)));

            if (Object.keys(documents).length === 0) {
                console.log(`[DocumentUpload] [${user.id}] Error: No files were successfully processed`);
                return errorResponse(HTTP_STATUS.BAD_REQUEST, "No valid files provided in request. Check if files are correctly attached.", {});
            }

            // Check mandatory fields
            const mandatoryFields = ['aadharCard', 'panCard', 'businessRegistration', 'gstRegistration'];
            for (const field of mandatoryFields) {
                const inRequest = documents[field] && (!Array.isArray(documents[field]) || documents[field].length > 0);
                const inDb = currentVendor?.documents?.[field] && (!Array.isArray(currentVendor.documents[field]) || currentVendor.documents[field].length > 0);

                if (!inRequest && !inDb) {
                    console.log(`[DocumentUpload] [${user.id}] Error: Mandatory field ${field} missing`);
                    return errorResponse(HTTP_STATUS.BAD_REQUEST, `Mandatory document missing: ${field}`, {});
                }
            }

            console.log(`[DocumentUpload] [${user.id}] Updating profile in DB...`);
            await VendorService.upsertProfile(user.id, { documents });

            const duration = Date.now() - startTime;
            console.log(`[DocumentUpload] [${user.id}] Completed successfully in ${duration}ms`);

            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.DOCUMENTS_UPLOADED, {});
        } catch (error) {
            const duration = Date.now() - startTime;
            console.error(`[DocumentUpload] [${user?.id || 'unknown'}] CRITICAL FAILURE after ${duration}ms:`, error);
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // POST /vendor/profile (Create or Update)
    async updateProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});
            const body = req.jsonBody || await req.json();
            const { businessName, category } = body;
            if (!businessName || !category) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }
            const vendor = await VendorService.upsertProfile(user.id, body);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.PROFILE_UPDATED, {});
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

    // GET /vendor/documents
    async getDocuments(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { documents: vendor.documents || {} });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /vendor/profile
    async getProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const vendor = await VendorService.getFullProfile(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { profile: vendor });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /vendor/categories
    async getCategories(req) {
        const categories = await CategoryService.getAllCategories();
        return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { categories });
    }

    // POST /vendor/document/delete
    async deleteDocument(req) {
        return errorResponse(HTTP_STATUS.NOT_IMPLEMENTED, RESPONSE_MESSAGES.ERROR.NOT_IMPLEMENTED, {});
    }

    // POST /vendor/document/update
    async updateDocument(req) {
        return errorResponse(HTTP_STATUS.NOT_IMPLEMENTED, RESPONSE_MESSAGES.ERROR.NOT_IMPLEMENTED, {});
    }

    // POST /vendor/bank/create (Multipart Form Data)
    async createBankDetails(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const formData = req.formDataBody;
            if (!formData) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});

            const bankData = {};
            let cancelledChequePath = '';

            for (const [key, value] of formData.entries()) {
                if (key === 'cancelChequered' && value instanceof File) {
                    console.log(`[BankDetails] [${user.id}] Uploading cancelled cheque to Cloudinary...`);
                    const result = await uploadToCloudinary(value, `bank/${user.id}`);
                    cancelledChequePath = result.url;
                } else if (key === 'accountHolderName') {
                    bankData.accountHolder = value;
                } else if (key === 'bankAccount') {
                    bankData.accountNumber = value;
                } else if (key === 'ifscCode') {
                    bankData.ifscCode = value;
                } else if (key === 'bankName') {
                    bankData.bankName = value;
                }
            }

            if (cancelledChequePath) {
                bankData.cancelledCheque = cancelledChequePath;
            }

            const vendor = await VendorService.upsertProfile(user.id, { bankDetails: bankData });
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.BANK_DETAILS_SAVED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // GET /vendor/bank
    async getBankDetails(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.NOT_FOUND, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.FETCH, { bankDetails: vendor.bankDetails || {} });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /vendor/bank/update
    async updateBankDetails(req) {
        return this.createBankDetails(req);
    }

    // POST /vendor/bank/delete
    async deleteBankDetails(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            await VendorService.upsertProfile(user.id, { bankDetails: {} });
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.DELETE, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

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

            const allowedServices = packages.category.map(c => categoryMap[c]).filter(Boolean);

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

    // POST /vendor/package/update-item
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

    // POST /vendor/package/delete-item
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
}

const vendorController = new VendorController();
export default vendorController;