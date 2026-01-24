const VendorService = require('../services/VendorService');
const PackageService = require('../services/PackageService');

class VendorController {

    // POST /vendor/profile/create (Multipart Form Data)
    async createProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            const formData = req.formDataBody;
            if (!formData) return { status: 400, data: { error: 'Multipart form data required' } };

            const data = {};
            const businessCategory = [];

            for (const [key, value] of formData.entries()) {
                if (key === 'profile_image' && value instanceof File) {
                    // Handle file upload
                    const fs = require('fs');
                    const path = require('path');
                    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
                    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                    const fileName = `${Date.now()}-${value.name}`;
                    const filePath = path.join(uploadsDir, fileName);
                    const buffer = Buffer.from(await value.arrayBuffer());
                    fs.writeFileSync(filePath, buffer);
                    data.profileImage = `/uploads/${fileName}`;
                } else if (key === 'businessRegistration' && value instanceof File) {
                    // Handle businessRegistration file upload
                    const fs = require('fs');
                    const path = require('path');
                    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
                    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                    const fileName = `${Date.now()}-biz-reg-${value.name}`;
                    const filePath = path.join(uploadsDir, fileName);
                    const buffer = Buffer.from(await value.arrayBuffer());
                    fs.writeFileSync(filePath, buffer);
                    data.businessRegistration = `/uploads/${fileName}`;
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
                return { status: 400, data: { error: 'Business name and category are required' } };
            }

            const vendor = await VendorService.upsertProfile(user.id, data);
            return { status: 201, data: { message: 'Profile created successfully' } };
        } catch (error) {
            return { status: 500, data: { error: 'Internal Server Error', details: error.message } };
        }
    }

    // POST /vendor/document/upload (Multipart Form Data)
    async uploadDocuments(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            const formData = req.formDataBody;
            if (!formData) return { status: 400, data: { error: 'Multipart form data required' } };

            const fs = require('fs');
            const path = require('path');
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

            const documents = {};
            const arrayFields = [
                'travelAgentPermit', 'passengerInsurancePolicy', 'adventureSportLicense',
                'guidCertification', 'liabilityWaiverForm', 'safetyEmergencyPlan',
                'riverRaftingPermit', 'technicalSafetyCertificate', 'insuranceCoverageDocument',
                'homestayRegistrationCertificate', 'gstCertificate', 'hotelLicense',
                'fssaiLicense', 'safetyAuditReport', 'structuralFitnessCertificate',
                'rtoPermit', 'insuranceTaxReceipt'
            ];

            for (const [key, value] of formData.entries()) {
                if (value instanceof File || (value instanceof Blob && value.name)) {
                    const fileName = `${Date.now()}-${value.name}`;
                    const filePath = path.join(uploadsDir, fileName);
                    const buffer = Buffer.from(await value.arrayBuffer());
                    fs.writeFileSync(filePath, buffer);
                    const relativePath = `/uploads/documents/${fileName}`;

                    // Match array fields like travelAgentPermit[0]
                    const arrayMatch = key.match(/^(.+)\[\d+\]$/);
                    const docObject = {
                        url: relativePath,
                        status: 'pending',
                        reason: null
                    };

                    if (arrayMatch) {
                        const fieldName = arrayMatch[1];
                        if (!documents[fieldName]) documents[fieldName] = [];
                        documents[fieldName].push(docObject);
                    } else {
                        documents[key] = docObject;
                    }
                }
            }

            if (Object.keys(documents).length === 0) {
                return { status: 400, data: { error: 'No files uploaded' } };
            }

            const mandatoryFields = ['aadharCardFront', 'aadharCardBack', 'panCard', 'businessRegistration', 'gstCertificate'];
            for (const field of mandatoryFields) {
                if (!documents[field] || (Array.isArray(documents[field]) && documents[field].length === 0)) {
                    return { status: 400, data: { error: `Mandatory document missing: ${field}` } };
                }
            }

            const vendor = await VendorService.upsertProfile(user.id, {
                documents
            });
            return {
                status: 200,
                data: {
                    message: 'Documents uploaded successfully'
                }
            };
        } catch (error) {
            return { status: 500, data: { error: 'Internal Server Error', details: error.message } };
        }
    }

    // POST /vendor/profile (Create or Update)
    async updateProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            console.log(`[VendorController] updateProfile called by User ID: ${user.id}`);

            const body = req.jsonBody || await req.json();
            const { businessName, category } = body;

            if (!businessName || !category) {
                return { status: 400, data: { error: 'Business name and category are required' } };
            }

            const vendor = await VendorService.upsertProfile(user.id, body);

            return { status: 200, data: { message: 'Profile updated', vendor } };
        } catch (error) {
            console.error('Update Profile Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // POST /vendor/create-package
    async createPackage(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') {
                return { status: 403, data: { error: 'Access denied. Vendors only.' } };
            }

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) {
                return { status: 400, data: { error: 'Vendor profile not completed' } };
            }

            const body = await req.json();
            const { title, price } = body;

            if (!title || !price) {
                return { status: 400, data: { error: 'Package title and price are required' } };
            }

            const newPackage = await PackageService.createPackage(vendor._id, body);

            return { status: 201, data: { message: 'Package created', package: newPackage } };
        } catch (error) {
            console.error('Create Package Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // GET /vendor/documents
    async getDocuments(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return { status: 404, data: { error: 'Vendor profile not found' } };

            return { status: 200, data: { documents: vendor.documents || {} } };
        } catch (error) {
            console.error('Get Documents Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // GET /vendor/profile
    async getProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            const vendor = await VendorService.getFullProfile(user.id);
            if (!vendor) return { status: 404, data: { error: 'Vendor profile not found' } };

            return { status: 200, data: { profile: vendor } };
        } catch (error) {
            console.error('Get Profile Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // GET /vendor/categories
    async getCategories(req) {
        const categories = VendorService.getCategories();
        return { status: 200, data: { categories } };
    }

    // POST /vendor/document/delete
    async deleteDocument(req) {
        return { status: 501, data: { error: 'Not Implemented' } };
    }

    // POST /vendor/document/update
    async updateDocument(req) {
        return { status: 501, data: { error: 'Not Implemented' } };
    }

    // POST /vendor/bank/create (Multipart Form Data)
    async createBankDetails(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            const formData = req.formDataBody;
            if (!formData) return { status: 400, data: { error: 'Multipart form data required' } };

            const bankData = {};
            let cancelledChequePath = '';

            for (const [key, value] of formData.entries()) {
                if (key === 'cancelChequered' && value instanceof File) {
                    const fs = require('fs');
                    const path = require('path');
                    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'bank');
                    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

                    const fileName = `${Date.now()}-cheque-${value.name}`;
                    const filePath = path.join(uploadsDir, fileName);
                    const buffer = Buffer.from(await value.arrayBuffer());
                    fs.writeFileSync(filePath, buffer);
                    cancelledChequePath = `/uploads/bank/${fileName}`;
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
            return { status: 201, data: { message: 'Bank details added successfully' } };
        } catch (error) {
            console.error('Create Bank Details Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // GET /vendor/bank
    async getBankDetails(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return { status: 404, data: { error: 'Vendor profile not found' } };

            return { status: 200, data: { bankDetails: vendor.bankDetails || {} } };
        } catch (error) {
            console.error('Get Bank Details Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
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
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            await VendorService.upsertProfile(user.id, { bankDetails: {} });
            return { status: 200, data: { message: 'Bank details deleted successfully' } };
        } catch (error) {
            console.error('Delete Bank Details Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // GET /vendor/packages -> Returns the Single Catalog
    async getPackages(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            const packages = await VendorService.findByUserId(user.id);
            if (!packages) return { status: 400, data: { error: 'Vendor profile not found' } };

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
            return {
                status: 200,
                data: {
                    catalog: {
                        ...catalogObj,
                        services: filteredServices
                    }
                }
            };
        } catch (error) {
            console.error('Get Vendor Catalog Error:', error);
            return { status: 500, data: { error: 'Internal Server Error' } };
        }
    }

    // POST /vendor/package/add-item -> Add Service Item
    async addItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return { status: 400, data: { error: 'Vendor profile not found' } };

            const body = await req.json();
            // Expect: { category: 'homestay', item: { ... } }
            const { category, item } = body;
            if (!category || !item) return { status: 400, data: { error: 'Category and Item data required' } };

            const updatedCatalog = await PackageService.addServiceItem(vendor._id, category, item);
            return { status: 200, data: { message: 'Item added', catalog: updatedCatalog } };
        } catch (error) {
            console.error('Add Item Error:', error);
            return { status: 500, data: { error: error.message } };
        }
    }

    // POST /vendor/package/update-item
    async updateItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return { status: 400, data: { error: 'Vendor profile not found' } };

            const body = await req.json();
            const { category, itemId, updates } = body;
            if (!category || !itemId || !updates) return { status: 400, data: { error: 'Category, Item ID and Updates required' } };

            const updatedCatalog = await PackageService.updateServiceItem(vendor._id, category, itemId, updates);
            return { status: 200, data: { message: 'Item updated', catalog: updatedCatalog } };
        } catch (error) {
            console.error('Update Item Error:', error);
            return { status: 500, data: { error: error.message } };
        }
    }

    // POST /vendor/package/delete-item
    async deleteItem(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return { status: 400, data: { error: 'Vendor profile not found' } };

            const body = await req.json();
            const { category, itemId } = body;
            if (!category || !itemId) return { status: 400, data: { error: 'Category and Item ID required' } };

            const updatedCatalog = await PackageService.removeServiceItem(vendor._id, category, itemId);
            return { status: 200, data: { message: 'Item deleted', catalog: updatedCatalog } };
        } catch (error) {
            console.error('Delete Item Error:', error);
            return { status: 500, data: { error: error.message } };
        }
    }

    // POST /vendor/package/toggle-category
    async toggleCategoryStatus(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return { status: 400, data: { error: 'Vendor profile not found' } };

            const body = await req.json();
            const { category, isActive } = body;
            if (!category || typeof isActive !== 'boolean') return { status: 400, data: { error: 'Category and Status required' } };

            const updatedCatalog = await PackageService.toggleCategoryStatus(vendor._id, category, isActive);
            return { status: 200, data: { message: `Category ${category} status updated`, catalog: updatedCatalog } };
        } catch (error) {
            console.error('Toggle Category Error:', error);
            return { status: 500, data: { error: error.message } };
        }
    }
    // POST /vendor/package/toggle-item
    async toggleItemStatus(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };
            const vendor = await VendorService.findByUserId(user.id);
            if (!vendor) return { status: 400, data: { error: 'Vendor profile not found' } };

            const body = await req.json();
            const { category, itemId, isActive } = body;
            if (!category || !itemId || typeof isActive !== 'boolean') return { status: 400, data: { error: 'Category, Item ID and Status required' } };

            const updatedCatalog = await PackageService.toggleItemStatus(vendor._id, category, itemId, isActive);
            return { status: 200, data: { message: 'Item status updated', catalog: updatedCatalog } };
        } catch (error) {
            console.error('Toggle Item Status Error:', error);
            return { status: 500, data: { error: error.message } };
        }
    }
}

module.exports = new VendorController();
