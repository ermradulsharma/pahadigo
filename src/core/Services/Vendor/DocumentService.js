import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import Vendor from '@/core/Models/Vendor.js';
import CacheService from '@/core/Services/CacheService.js';

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
    const query = Vendor.findOne({ user: userId, deletedAt: null });
    const vendor = await (query?.lean ? query.lean() : query);
    if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    const updatePayload = {};

    if (files.aadharCard) {
      const tempAadhar = [];
      const aadharFiles = Array.isArray(files.aadharCard) ? files.aadharCard : [files.aadharCard];
      for (let i = 0; i < aadharFiles.length; i++) {
        if (typeof aadharFiles[i] === 'object' && aadharFiles[i].size) {
          const res = await uploadToCloudinary(aadharFiles[i], `vendor_documents/aadhar/${userId}`);
          tempAadhar.push({ url: res.url, publicId: res.publicId });
        }
      }
      if (tempAadhar.length > 0) {
        updatePayload['documents.aadharCard'] = tempAadhar;
      }
    }

    const processSingleDoc = async (key, folder) => {
      if (files[key] && typeof files[key] === 'object' && files[key].size) {
        const res = await uploadToCloudinary(files[key], `vendor_documents/${folder}/${userId}`);
        updatePayload[`documents.${key}`] = { url: res.url, publicId: res.publicId };
      }
    };

    await processSingleDoc('panCard', 'pan');
    await processSingleDoc('businessRegistration', 'registration');
    await processSingleDoc('gstRegistration', 'gst');

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
