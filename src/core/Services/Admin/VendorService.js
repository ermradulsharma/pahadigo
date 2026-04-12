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
    const mongoose = (await import('mongoose')).default;
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
          foreignField: 'user_id',
          as: 'vendorDocuments'
        }
      },
      {
        $lookup: {
          from: 'packages',
          let: { userId: '$vendorProfile._id', businessId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$vendor', '$$businessId'] },
                    { $eq: ['$business', '$$userId'] }
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

    NotificationService.notifyDocumentVerification(doc.vendor_id, "A Category Specific Document", status === 'approved' || status === 'verified');
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
    await BusinessService.evaluateVendorTrustBadge(vendorId);

    if (req && req.user) await AuditService.logAction(req.user.id, 'OCR_VERIFY', 'DOCUMENT', vendorId, { docType: ocrResult.idType }, req);
    return identityData;
  }

  async verifyManualDocument(data, req = null) {
    const { vendorId, documentField, status, reason, index } = data;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

    if (!vendor.documents || !vendor.documents[documentField]) {
      throw new Error(RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND);
    }

    if (Array.isArray(vendor.documents[documentField])) {
      if (typeof index !== 'number') throw new Error(RESPONSE_MESSAGES.ERROR.INDEX_REQUIRED);
      if (!vendor.documents[documentField][index]) throw new Error(RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND);

      vendor.documents[documentField][index].status = status;
      vendor.documents[documentField][index].reason = status === 'rejected' ? reason : null;
    } else {
      vendor.documents[documentField].status = status;
      vendor.documents[documentField].reason = status === 'rejected' ? reason : null;
    }

    vendor.markModified('documents');
    await vendor.save();

    NotificationService.notifyDocumentVerification(vendorId, documentField, status === 'verified' || status === 'approved');
    await BusinessService.evaluateVendorTrustBadge(vendorId);

    if (req && req.user) {
      await AuditService.logAction(req.user.id, 'VERIFY', 'DOCUMENT', vendorId, { field: documentField, status }, req);
    }
    return true;
  }
}

export default new VendorService();
