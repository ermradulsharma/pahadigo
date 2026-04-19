import User from '@/models/User.js';
import Vendor from '@/models/Vendor.js';
import VendorDocument from '@/models/VendorDocument.js';
import VendorPackage from '@/models/Package.js';
import VerifiedIdentity from '@/models/VerifiedIdentity.js';
import OCRService from '@/services/Admin/OCRService.js';
import NotificationService from '@/services/General/NotificationService.js';
import BusinessService from '@/services/Vendor/BusinessService.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';
import { mapToGeoJSON } from '@/helpers/geoUtils.js';
import AuditService from './AuditService.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

/**
 * VendorService (Admin Role)
 * Administration and lifecycle management of vendors, including verification.
 */
class VendorService {
  async getAllVendors() {
    return await User.aggregate([
      { $match: { role: 'vendor' } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: 'user',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          ownerName: { $ifNull: ["$profile.ownerName", "$name"] },
          businessName: { $ifNull: ["$profile.businessName", "N/A"] },
          businessRegistration: { $ifNull: ["$profile.businessRegistration", "N/A"] },
          gstNumber: { $ifNull: ["$profile.gstNumber", "N/A"] },
          isApproved: { $ifNull: ["$profile.isApproved", false] },
          hasProfile: { $cond: [{ $ifNull: ["$profile", false] }, true, false] },
          createdAt: 1
        }
      }
    ]);
  }

  async getVendorById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const results = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: 'user',
          as: 'vendorProfile'
        }
      },
      { $unwind: { path: '$vendorProfile', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'vendordocuments',
          localField: '_id',
          foreignField: 'user',
          as: 'vendorDocuments'
        }
      },
      {
        $lookup: {
          from: 'packages',
          let: { vendorId: '$vendorProfile._id', userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$vendor', '$$vendorId'] },
                    { $eq: ['$user', '$$userId'] }
                  ]
                }
              }
            }
          ],
          as: 'VendorPackage'
        }
      },
      { $unwind: { path: '$VendorPackage', preserveNullAndEmptyArrays: true } }
    ]);

    return results[0] || null;
  }

  async createVendor(data, req = null) {
    let existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      if (existingUser.role !== 'vendor') throw new Error("Email registered with different role.");
    } else {
      existingUser = await User.create({
        email: data.email,
        phone: data.phone,
        name: data.ownerName || data.businessName,
        password: data.password || crypto.randomBytes(8).toString('hex'),
        role: 'vendor', isVerified: true
      });
    }

    const existingVendor = await Vendor.findOne({ user: existingUser._id });
    if (existingVendor) throw new Error("Vendor profile already exists.");

    const vendor = await Vendor.create({
      user: existingUser._id,
      ownerName: data.ownerName || existingUser.name,
      businessName: data.businessName,
      isApproved: true
    });

    if (req && req.user) {
      await AuditService.logAction(req.user.id, 'CREATE', 'VENDOR', vendor._id, { businessName: vendor.businessName }, req);
    }
    return { user: existingUser, vendor };
  }

  async updateVendor(id, data, req = null) {
    let vendor = await Vendor.findById(id);
    let user = null;

    if (vendor) {
      user = await User.findById(vendor.user);
    } else {
      user = await User.findById(id);
      if (user) vendor = await Vendor.findOne({ user: id });
    }

    if (!vendor && !user) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    const userFields = ['name', 'phone', 'status', 'isVerified', 'isVendorVerified'];
    const vendorFields = ['ownerName', 'businessName', 'address', 'bankDetails', 'documents', 'isApproved', 'isOperating', 'trustBadge'];

    const userData = {};
    const vendorUpdateData = {};

    Object.keys(data).forEach(key => {
      if (userFields.includes(key)) userData[key] = data[key];
      if (vendorFields.includes(key)) vendorUpdateData[key] = data[key];
      // Special mapping for vendor profile status
      if (key === 'profileStatus') vendorUpdateData['status'] = data[key];
    });

    if (vendor && Object.keys(vendorUpdateData).length > 0) {
      if (data.address) {
        vendorUpdateData.address = { ...(vendor.address || {}), ...data.address };
        mapToGeoJSON(vendorUpdateData.address, 'location');
      }
      await Vendor.findByIdAndUpdate(vendor._id, { $set: vendorUpdateData });
    }

    if (user && Object.keys(userData).length > 0) {
      if (data.preferences) {
        const existing = user.preferences || {};
        userData.preferences = { ...existing, ...data.preferences };
      }
      await User.findByIdAndUpdate(user._id, { $set: userData });
    }

    if (req && req.user) {
      await AuditService.logAction(req.user.id, 'UPDATE', 'VENDOR', id, { changes: data }, req);
    }

    return await User.findById(user?._id || id).populate('vendorProfile');
  }

  async updateVendorStatus(vendorId, status, req = null) {
    const isApproved = status !== 'rejected' && status !== 'suspended';
    const userStatus = isApproved ? 'active' : 'suspended';

    // Flexibility: Try finding by Profile ID first, then by User ID
    let vendor = await Vendor.findById(vendorId);
    if (!vendor) vendor = await Vendor.findOne({ user: vendorId });

    if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    vendor.isApproved = isApproved;
    await vendor.save();

    // Update User Status
    await User.findByIdAndUpdate(vendor.user, { status: userStatus });

    // Trust evaluation
    await BusinessService.calculateTrustBadge(vendor._id);

    if (isApproved) NotificationService.notifyVendorApproval(vendor._id, true);

    if (req && req.user) {
      await AuditService.logAction(req.user.id, 'UPDATE_STATUS', 'VENDOR', vendor._id, { status }, req);
    }

    return await User.findById(vendor.user).populate('vendorProfile');
  }

  async deleteVendor(id) {
    const vendor = await Vendor.findById(id);
    if (vendor) {
      await User.findByIdAndDelete(vendor.user);
      await Vendor.findByIdAndDelete(id);
    } else {
      const user = await User.findById(id);
      if (user) {
        await Vendor.findOneAndDelete({ user: id });
        await User.findByIdAndDelete(id);
      }
    }
    return true;
  }

  // --- Verification & OCR ---

  async verifyCategoryDocument(data, req = null) {
    const { documentId, status, reason } = data;
    const doc = await VendorDocument.findById(documentId);
    if (!doc) throw new Error(RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND);

    doc.status = status;
    doc.rejection_reason = status === 'rejected' ? reason : null;
    await doc.save();

    NotificationService.notifyDocumentVerification(doc.vendor, "A Category Specific Document", status === 'approved' || status === 'verified');
    if (req && req.user) await AuditService.logAction(req.user.id, 'VERIFY', 'CATEGORY_DOCUMENT', documentId, { status }, req);
    return doc;
  }

  async verifyDocumentOCR(data, req = null) {
    const { vendorId, documentField, index } = data;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    let doc = null;
    if (Array.isArray(vendor.documents[documentField])) {
      if (typeof index !== 'number') throw new Error(RESPONSE_MESSAGES.ERROR.INDEX_REQUIRED);
      doc = vendor.documents[documentField][index];
    } else {
      doc = vendor.documents[documentField];
    }

    if (!doc || !doc.url) throw new Error(RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND);

    // Fetch and process image (Cloudinary optimization if available)
    const optimizedUrl = doc.url.includes('cloudinary') ? doc.url.replace('/upload/', '/upload/f_jpg,q_auto/') : doc.url;
    const imgRes = await fetch(optimizedUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch document image (Status: ${imgRes.status})`);

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length < 100) throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_IMAGE);

    const ocrResult = await OCRService.processDocument(buffer);
    if (ocrResult.error) throw new Error(RESPONSE_MESSAGES.ERROR.SERVER_ERROR);

    // Save identity records
    const identityData = {
      vendor: vendorId,
      docType: ocrResult.idType,
      idNumber: ocrResult.identifiedId || "UNKNOWN",
      name: ocrResult.name,
      dateOfBirth: ocrResult.dob,
      rawOcrText: ocrResult.text
    };

    await VerifiedIdentity.findOneAndUpdate(
      { vendor: vendorId, docType: ocrResult.idType },
      identityData,
      { upsert: true, returnDocument: 'after' }
    );

    // Update document status in vendor profile
    if (Array.isArray(vendor.documents[documentField])) {
      vendor.documents[documentField][index].status = 'verified';
      vendor.documents[documentField][index].ocrData = { identifiedId: ocrResult.identifiedId, text: ocrResult.text };
    } else {
      vendor.documents[documentField].status = 'verified';
      vendor.documents[documentField].ocrData = { identifiedId: ocrResult.identifiedId, text: ocrResult.text };
    }

    vendor.markModified('documents');
    vendor.isApproved = true;
    await vendor.save();
    await BusinessService.calculateTrustBadge(vendorId);

    if (req && req.user) await AuditService.logAction(req.user.id, 'OCR_VERIFY', 'DOCUMENT', vendorId, { docType: ocrResult.idType }, req);
    return identityData;
  }

  async verifyManualDocument(data, req = null) {
    const { vendorId, documentField, status, reason, index } = data;

    // Robust lookup: vendorId could be the User ID or the Vendor Profile ID
    let vendor = await Vendor.findById(vendorId);
    if (!vendor) vendor = await Vendor.findOne({ user: vendorId });

    if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    // Support nested paths (e.g., 'bankDetails.cancelledCheque') or default to 'documents' object
    const pathParts = documentField.includes('.') ? documentField.split('.') : ['documents', documentField];
    let parent = vendor;

    for (let i = 0; i < pathParts.length - 1; i++) {
      parent = parent[pathParts[i]];
      if (!parent) throw new Error(RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND);
    }

    const fieldName = pathParts[pathParts.length - 1];
    let doc = parent[fieldName];

    if (!doc) {
      throw new Error(RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND);
    }

    if (Array.isArray(doc)) {
      if (typeof index !== 'number') throw new Error(RESPONSE_MESSAGES.ERROR.INDEX_REQUIRED);
      if (!doc[index]) throw new Error(RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND);

      doc[index].status = status;
      doc[index].reason = status === 'rejected' ? reason : null;
    } else {
      doc.status = status;
      doc.reason = status === 'rejected' ? reason : null;
    }

    // Flag the modified path for Mongoose save
    vendor.markModified(documentField.includes('.') ? documentField : `documents.${documentField}`);
    await vendor.save();

    NotificationService.notifyDocumentVerification(vendorId, documentField, status === 'verified' || status === 'approved');
    await BusinessService.calculateTrustBadge(vendor._id);

    if (req && req.user) {
      await AuditService.logAction(req.user.id, 'VERIFY', 'DOCUMENT', vendor._id, { field: documentField, status }, req);
    }
    return true;
  }
}

export default new VendorService();
