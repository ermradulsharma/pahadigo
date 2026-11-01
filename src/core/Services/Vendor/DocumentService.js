import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Vendor from '@/core/Models/Vendor.js';
import CacheService from '@/core/Services/CacheService.js';
import { AppError } from '@/core/Errors/AppError.js';
import { getBusinessByUserId } from '@/core/Helpers/queryHelpers.js';

class DocumentService {
    async invalidateVendorCaches(userId, vendorId = null) {
        await CacheService.del('admin:vendors:all');
        await CacheService.del('admin:dashboard:stats');
        if (userId) {
            await CacheService.del(`admin:vendors:${userId}`);
            await CacheService.del(`user:profile:${userId}`);
        }
        if (vendorId) {
            await CacheService.del(`admin:vendors:${vendorId}`);
        }
    }

    /**
     * Upload and synchronize business verification documents
     */
    async uploadVerificationFiles(userId, files) {
        const vendor = await getBusinessByUserId(userId, '_id');
        if (!vendor) throw AppError.notFound(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

        const updatePayload = {};
        const uploadTasks = [];

        // Parallel upload for Aadhar card files
        if (files.aadharCard) {
            const aadharFiles = Array.isArray(files.aadharCard) ? files.aadharCard : [files.aadharCard];
            const validAadharFiles = aadharFiles.filter(f => typeof f === 'object' && f?.size);
            if (validAadharFiles.length > 0) {
                uploadTasks.push(
                    Promise.all(
                        validAadharFiles.map(async (file) => {
                            const res = await uploadToCloudinary(file, `vendor_documents/aadhar/${userId}`);
                            return { url: res.url, publicId: res.publicId };
                        })
                    ).then((results) => {
                        if (results.length > 0) {
                            updatePayload['documents.aadharCard'] = results;
                        }
                    })
                );
            }
        }

        // Parallel upload for single documents (PAN, Business Registration, GST)
        const singleDocs = [
            { key: 'panCard', folder: 'pan' },
            { key: 'businessRegistration', folder: 'registration' },
            { key: 'gstRegistration', folder: 'gst' }
        ];

        for (const { key, folder } of singleDocs) {
            if (files[key] && typeof files[key] === 'object' && files[key]?.size) {
                uploadTasks.push(
                    uploadToCloudinary(files[key], `vendor_documents/${folder}/${userId}`).then((res) => {
                        updatePayload[`documents.${key}`] = { url: res.url, publicId: res.publicId };
                    })
                );
            }
        }

        if (uploadTasks.length > 0) {
            await Promise.all(uploadTasks);
        }

        if (Object.keys(updatePayload).length > 0) {
            const updatedVendor = await Vendor.findOneAndUpdate(
                { _id: vendor._id },
                { $set: updatePayload },
                { returnDocument: 'after' }
            );
            await this.invalidateVendorCaches(userId, vendor._id);
            return updatedVendor.documents;
        }

        return vendor.documents;
    }

    /**
     * Update specific document metadata or replace file
     */
    async updateDocument(userId, updateData) {
        const vendor = await Vendor.findOneAndUpdate(
            { user: userId },
            { $set: { "documents.$[elem]": updateData.fileData } },
            { arrayFilters: [{ "elem._id": updateData.id }], returnDocument: 'after' }
        );
        if (vendor) {
            await this.invalidateVendorCaches(userId, vendor._id);
        }
        return vendor ? vendor.documents : null;
    }

    /**
     * Remove a document from the business profile
     */
    async deleteDocument(userId, documentId) {
        const vendor = await Vendor.findOneAndUpdate(
            { user: userId },
            { $pull: { "documents.aadharCard": { _id: documentId } } },
            { returnDocument: 'after' }
        );
        if (vendor) {
            await this.invalidateVendorCaches(userId, vendor._id);
        }
        return vendor ? vendor.documents : null;
    }

    // --- INDUSTRY STANDARD ALIASES ---
    async removeDocument(...args) { return this.deleteDocument(...args); }
}

export default new DocumentService();
