import VendorService from '../services/VendorService.js';
import PackageService from '../services/PackageService.js';
import { successResponse, errorResponse } from '../helpers/response.js';
import fs from 'fs';
import path from 'path';
import CategoryService from '../services/CategoryService.js'

class VendorController {

    // POST /vendor/profile/create (Multipart Form Data)
    async createProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});

            const formData = req.formDataBody;
            if (!formData) return errorResponse(400, 'Multipart form data required', {});

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
                return errorResponse(400, 'Business name and category are required', {});
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

            return successResponse(201, 'Profile created successfully', { vendor: vendorObj });
        } catch (error) {
            return errorResponse(500, error.message, {});
        }
    }

    // POST /vendor/document/upload (Multipart Form Data)
    async uploadDocuments(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});
            const currentVendor = await VendorService.findByUserId(user.id);
            const formData = req.formDataBody;
            if (!formData) return errorResponse(400, 'Multipart form data required', {});
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
                    console.error(`Failed to delete old file: ${relativeUrl}`, e.message);
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
                return errorResponse(400, 'No files uploaded', {});
            }
            const mandatoryFields = ['aadharCard', 'panCard', 'businessRegistration', 'gstRegistration'];
            for (const field of mandatoryFields) {
                if (!documents[field] || (Array.isArray(documents[field]) && documents[field].length === 0)) {
                    return errorResponse(400, `Mandatory document missing: ${field}`, {});
                }
            }
            const vendor = await VendorService.upsertProfile(user.id, {
                documents
            });
            return successResponse(201, 'Documents uploaded successfully', {});
        } catch (error) {
            console.error(error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /vendor/profile (Create or Update)
    async updateProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});
            const body = req.jsonBody || await req.json();
            const { businessName, category } = body;
            if (!businessName || !category) {
                return errorResponse(400, 'Business name and category are required', {});
            }
            const vendor = await VendorService.upsertProfile(user.id, body);
            return successResponse(200, 'Profile updated', {});
        } catch (error) {
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /vendor/create-package
    async createPackage(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Access denied. Vendors only.', {});

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(400, 'Vendor profile not completed', {});

            const body = await req.json();
            const { title, price } = body;

            if (!title || !price) {
                return errorResponse(400, 'Package title and price are required', {});
            }

            const newPackage = await PackageService.createPackage(vendor._id, body);

            return successResponse(201, 'Package created', {});
        } catch (error) {
            console.error('Create Package Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /vendor/documents
    async getDocuments(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(404, 'Vendor profile not found', {});

            return successResponse(200, 'Documents retrieved', { documents: vendor.documents || {} });
        } catch (error) {
            console.error('Get Documents Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /vendor/profile
    async getProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});

            const vendor = await VendorService.getFullProfile(user.id);
            if (!vendor) return errorResponse(404, 'Vendor profile not found', {});

            return successResponse(200, 'Profile retrieved', { profile: vendor });
        } catch (error) {
            console.error('Get Profile Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /vendor/categories
    async getCategories(req) {
        const categories = await CategoryService.getAllCategories();
        return successResponse(200, 'Categories retrieved', { categories });
    }

    // POST /vendor/document/delete
    async deleteDocument(req) {
        return errorResponse(501, 'Not Implemented', {});
    }

    // POST /vendor/document/update
    async updateDocument(req) {
        return errorResponse(501, 'Not Implemented', {});
    }

    // POST /vendor/bank/create (Multipart Form Data)
    async createBankDetails(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});

            const formData = req.formDataBody;
            if (!formData) return errorResponse(400, 'Multipart form data required', {});

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
            return successResponse(201, 'Bank details added successfully', {});
        } catch (error) {
            console.error('Create Bank Details Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /vendor/bank
    async getBankDetails(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(404, 'Vendor profile not found', {});

            return successResponse(200, 'Bank details retrieved', { bankDetails: vendor.bankDetails || {} });
        } catch (error) {
            console.error('Get Bank Details Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
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
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});

            await VendorService.upsertProfile(user.id, { bankDetails: {} });
            return successResponse(200, 'Bank details deleted successfully', {});
        } catch (error) {
            console.error('Delete Bank Details Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // GET /vendor/packages -> Returns the Single Catalog
    async getPackages(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});

            const packages = await VendorService.findByUserId(user.id);
            if (!packages) return errorResponse(400, 'Vendor profile not found', {});

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
            return successResponse(200, 'Vendor catalog retrieved', {
                catalog: {
                    ...catalogObj,
                    services: filteredServices
                }
            });
        } catch (error) {
            console.error('Get Vendor Catalog Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /vendor/package/add-item -> Add Service Item
    async addItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(400, 'Vendor profile not found', {});

            const body = await req.json();
            // Expect: { category: 'homestay', item: { ... } }
            const { category, item } = body;
            if (!category || !item) return errorResponse(400, 'Category and Item data required', {});

            const updatedCatalog = await PackageService.addServiceItem(vendor._id, category, item);
            return successResponse(200, 'Item added', { catalog: updatedCatalog });
        } catch (error) {
            console.error('Add Item Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /vendor/package/update-item
    async updateItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(400, 'Vendor profile not found', {});

            const body = await req.json();
            const { category, itemId, updates } = body;
            if (!category || !itemId || !updates) return errorResponse(400, 'Category, Item ID and Updates required', {});

            const updatedCatalog = await PackageService.updateServiceItem(vendor._id, category, itemId, updates);
            return successResponse(200, 'Item updated', { catalog: updatedCatalog });
        } catch (error) {
            console.error('Update Item Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /vendor/package/delete-item
    async deleteItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(400, 'Vendor profile not found', {});

            const body = await req.json();
            const { category, itemId } = body;
            if (!category || !itemId) return errorResponse(400, 'Category and Item ID required', {});

            const updatedCatalog = await PackageService.removeServiceItem(vendor._id, category, itemId);
            return successResponse(200, 'Item deleted', { catalog: updatedCatalog });
        } catch (error) {
            console.error('Delete Item Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }

    // POST /vendor/package/toggle-category
    async toggleCategoryStatus(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(400, 'Vendor profile not found', {});

            const body = await req.json();
            const { category, isActive } = body;
            if (!category || typeof isActive !== 'boolean') return errorResponse(400, 'Category and Status required', {});

            const updatedCatalog = await PackageService.toggleCategoryStatus(vendor._id, category, isActive);
            return successResponse(200, `Category ${category} status updated`, { catalog: updatedCatalog });
        } catch (error) {
            console.error('Toggle Category Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }
    // POST /vendor/package/toggle-item
    async toggleItemStatus(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return errorResponse(403, 'Vendors only', {});
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return errorResponse(400, 'Vendor profile not found', {});

            const body = await req.json();
            const { category, itemId, isActive } = body;
            if (!category || !itemId || typeof isActive !== 'boolean') return errorResponse(400, 'Category, Item ID and Status required', {});

            const updatedCatalog = await PackageService.toggleItemStatus(vendor._id, category, itemId, isActive);
            return successResponse(200, 'Item status updated', { catalog: updatedCatalog });
        } catch (error) {
            console.error('Toggle Item Status Error:', error);
            return errorResponse(500, 'Internal Server Error', {});
        }
    }
}

const vendorController = new VendorController();
export default vendorController;
