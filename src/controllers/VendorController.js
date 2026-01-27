import VendorService from '../services/VendorService.js';
import PackageService from '../services/PackageService.js';
import { successResponse, errorResponse } from '../helpers/response.js';
import fs from 'fs';
import path from 'path';
import CategoryService from '../services/CategoryService.js'
import { HTTP_STATUS, RESPONSE_MESSAGES } from '../constants/index.js';

class VendorController {

    // POST /vendor/profile/create (Multipart Form Data)
    async createProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});

            const formData = req.formDataBody;
            if (!formData) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});

            const data = {};
            const businessCategory = [];

            for (const [key, value] of formData.entries()) {
                if (key === 'profile_image' && value instanceof File) {
                    // Handle file upload
                    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profile', user.id);
                    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                    const fileName = `${Date.now()}-${value.name}`;
                    const filePath = path.join(uploadsDir, fileName);
                    const buffer = Buffer.from(await value.arrayBuffer());
                    fs.writeFileSync(filePath, buffer);
                    data.profileImage = `/uploads/profile/${user.id}/${fileName}`;
                } else if (key === 'businessRegistration' && value instanceof File) {
                    // Handle businessRegistration file upload
                    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profile', user.id);
                    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                    const fileName = `${Date.now()}-biz-reg-${value.name}`;
                    const filePath = path.join(uploadsDir, fileName);
                    const buffer = Buffer.from(await value.arrayBuffer());
                    fs.writeFileSync(filePath, buffer);
                    data.businessRegistration = `/uploads/profile/${user.id}/${fileName}`;
                } else if (key.startsWith('businessCategory[')) {
                    businessCategory.push(value);
                } else if (key === 'businessNumber') {
                    data.businessPhone = value;
                } else if (key === 'businessAbout') {
                    data.description = value;
                } else if (key === 'businessRegistration' && typeof value === 'string') {
                    data.businessRegistration = value;
                } else {
                    data[key] = value;
                }
            }

            if (businessCategory.length > 0) data.category = businessCategory;

            if (!data.businessName || !data.category) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }

            const vendor = await VendorService.upsertProfile(user.id, data);

            // Enrich response with Base URL
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const vendorObj = vendor.toObject ? vendor.toObject() : { ...vendor };

            if (vendorObj.profileImage && !vendorObj.profileImage.startsWith('http')) {
                vendorObj.profileImage = `${baseUrl}${vendorObj.profileImage}`;
            }
            if (vendorObj.businessRegistration && !vendorObj.businessRegistration.startsWith('http')) {
                vendorObj.businessRegistration = `${baseUrl}${vendorObj.businessRegistration}`;
            }

            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.PROFILE_CREATED, { vendor: vendorObj });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, error.message, {});
        }
    }

    // POST /vendor/document/upload (Multipart Form Data)
    async uploadDocuments(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});
            const currentVendor = await VendorService.findByUserId(user.id);
            const formData = req.formDataBody;
            if (!formData) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.FORM_DATA_REQUIRED, {});
            const baseUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents', user.id);
            const documents = {};
            const handledDeletions = new Set();
            const deleteOldFile = (relativeUrl) => {
                if (!relativeUrl) return;
                try {
                    const cleanUrl = relativeUrl.split('?')[0];
                    const fullPath = path.join(process.cwd(), 'public', cleanUrl);
                    if (fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                } catch (e) {
                    // Failed to delete old file
                }
            };
            for (const [key, value] of formData.entries()) {
                if (value instanceof File || (value instanceof Blob && value.name)) {
                    let targetField = key;
                    const arrayMatch = key.match(/^(.+)\[\d+\]$/);
                    if (arrayMatch) {
                        targetField = arrayMatch[1];
                    }
                    if (currentVendor && currentVendor.documents && !handledDeletions.has(targetField)) {
                        const oldDoc = currentVendor.documents[targetField];
                        if (oldDoc) {
                            if (Array.isArray(oldDoc)) {
                                oldDoc.forEach(doc => deleteOldFile(doc.url));
                            } else if (oldDoc.url) {
                                deleteOldFile(oldDoc.url);
                            }
                        }
                        handledDeletions.add(targetField);
                    }
                    const fieldUploadsDir = path.join(baseUploadsDir, targetField);
                    if (!fs.existsSync(fieldUploadsDir)) fs.mkdirSync(fieldUploadsDir, { recursive: true });
                    const fileName = `${Date.now()}-${value.name}`;
                    const filePath = path.join(fieldUploadsDir, fileName);
                    const buffer = Buffer.from(await value.arrayBuffer());
                    fs.writeFileSync(filePath, buffer);
                    const relativePath = `/uploads/documents/${user.id}/${targetField}/${fileName}`;
                    const docObject = {
                        url: relativePath,
                        status: 'pending',
                        reason: null
                    };
                    if (['panCard', 'businessRegistration', 'gstRegistration'].includes(targetField)) {
                        documents[targetField] = docObject;
                    } else {
                        if (!documents[targetField]) documents[targetField] = [];
                        documents[targetField].push(docObject);
                    }
                }
            }
            if (Object.keys(documents).length === 0) {
                return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});
            }
            const mandatoryFields = ['aadharCard', 'panCard', 'businessRegistration', 'gstRegistration'];
            for (const field of mandatoryFields) {
                if (!documents[field] || (Array.isArray(documents[field]) && documents[field].length === 0)) {
                    return errorResponse(HTTP_STATUS.BAD_REQUEST, `Mandatory document missing: ${field}`, {});
                }
            }
            const vendor = await VendorService.upsertProfile(user.id, {
                documents
            });
            return successResponse(HTTP_STATUS.CREATED, RESPONSE_MESSAGES.SUCCESS.DOCUMENTS_UPLOADED, {});
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
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
                    // fs and path imported at top
                    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'bank', user.id);
                    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                    const fileName = `${Date.now()}-cheque-${value.name}`;
                    const filePath = path.join(uploadsDir, fileName);
                    const buffer = Buffer.from(await value.arrayBuffer());
                    fs.writeFileSync(filePath, buffer);
                    cancelledChequePath = `/uploads/bank/${user.id}/${fileName}`;
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

    // POST /vendor/package/add-item -> Add Service Item
    async addItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            const body = req.jsonBody || await req.json();
            // Expect: { category: 'homestay', item: { ... } }
            const { category, item } = body;
            if (!category || !item) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            const updatedCatalog = await PackageService.addServiceItem(vendor._id, category, item);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.ITEM_ADDED, { catalog: updatedCatalog });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
        }
    }

    // POST /vendor/package/update-item
    async updateItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(HTTP_STATUS.FORBIDDEN, RESPONSE_MESSAGES.AUTH.VENDORS_ONLY, {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.ERROR.VENDOR_NOT_FOUND, {});

            const body = req.jsonBody || await req.json();
            const { category, itemId, updates } = body;
            if (!category || !itemId || !updates) return errorResponse(HTTP_STATUS.BAD_REQUEST, RESPONSE_MESSAGES.VALIDATION.REQUIRED_FIELDS, {});

            const updatedCatalog = await PackageService.updateServiceItem(vendor._id, category, itemId, updates);
            return successResponse(HTTP_STATUS.OK, RESPONSE_MESSAGES.SUCCESS.UPDATE, { catalog: updatedCatalog });
        } catch (error) {
            return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER_ERROR, {});
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
