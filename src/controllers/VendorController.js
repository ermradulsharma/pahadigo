const VendorService = require('../services/VendorService');
const PackageService = require('../services/PackageService');

class VendorController {

    // POST /vendor/profile (Create or Update)
    async updateProfile(req) {
        try {
            const user = req.user;
            if (!user || user.role !== 'vendor') return { status: 403, data: { error: 'Vendors only' } };

            const body = await req.json();
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
            return { status: 201, data: { message: 'Profile created successfully', vendor } };
        } catch (error) {
            console.error('Create Profile Error:', error);
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
                    if (arrayMatch) {
                        const fieldName = arrayMatch[1];
                        if (!documents[fieldName]) documents[fieldName] = [];
                        documents[fieldName].push(relativePath);
                    } else {
                        documents[key] = relativePath;
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

            const vendor = await VendorService.upsertProfile(user.id, { documents });
            return {
                status: 200,
                data: {
                    message: 'Documents uploaded successfully',
                    documents: vendor.documents
                }
            };
        } catch (error) {
            console.error('Document Upload Error:', error);
            return { status: 500, data: { error: 'Internal Server Error', details: error.message } };
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
            return { status: 201, data: { message: 'Bank details added successfully', bankDetails: vendor.bankDetails } };
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
        // Reuse create logic as upsert is used
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

}

module.exports = new VendorController();
