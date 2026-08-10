import User from '@/core/Models/User.js';
import Vendor from '@/core/Models/Vendor.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import VendorPackage from '@/core/Models/Package.js';
import VerifiedIdentity from '@/core/Models/VerifiedIdentity.js';
import OCRService from '@/core/Services/Admin/OCRService.js';
import NotificationService from '@/core/Services/General/NotificationService.js';
import BusinessService from '@/core/Services/Vendor/BusinessService.js';
import CacheService from '@/core/Services/CacheService.js';
import AuditService from '@/core/Services/Admin/AuditService.js';
import AppError from '@/core/Helpers/AppError.js';
import { RESPONSE_MESSAGES, USER_ROLES, STATUS, VERIFICATION_STATUS, HTTP_STATUS } from '@/core/Constants/index.js';
import { mapToGeoJSON } from '@/core/Helpers/geoUtils.js';
import crypto from 'crypto';
import mongoose from 'mongoose';

/**
 * VendorService (Admin Role)
 * Administration and lifecycle management of vendors, including verification.
 */
class VendorService {
    
    // Helper to invalidate vendor caches
    async invalidateVendorCaches(vendorId = null) {
        await CacheService.del('admin:vendors:all');
        if (vendorId) {
            await CacheService.del(`admin:vendors:${vendorId}`);
        }
    }

    async getAllVendors() {
        const cacheKey = 'admin:vendors:all';
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached;

        const vendors = await User.aggregate([
            { $match: { role: USER_ROLES.VENDOR } },
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

        await CacheService.set(cacheKey, vendors, 1800); // 30 mins
        return vendors;
    }

    async getVendorById(id) {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;

        const cacheKey = `admin:vendors:${id}`;
        const cached = await CacheService.get(cacheKey);
        if (cached) return cached;

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

        const vendor = results[0] || null;
        if (vendor) await CacheService.set(cacheKey, vendor, 1800);
        return vendor;
    }

    async createVendor(data, req = null) {
        const session = await mongoose.startSession();
        let result = null;

        await session.withTransaction(async () => {
            let existingUser = await User.findOne({ email: data.email }).session(session).lean();
            let userId;

            if (existingUser) {
                if (existingUser.role !== USER_ROLES.VENDOR) {
                    throw new AppError(RESPONSE_MESSAGES.AUTH.ROLE_MISMATCH, HTTP_STATUS.BAD_REQUEST);
                }
                userId = existingUser._id;
            } else {
                const newUser = await User.create([{
                    email: data.email,
                    phone: data.phone,
                    name: data.ownerName || data.businessName,
                    password: data.password || crypto.randomBytes(8).toString('hex'),
                    role: USER_ROLES.VENDOR, 
                    isVerified: true
                }], { session });
                userId = newUser[0]._id;
                existingUser = newUser[0];
            }

            const existingVendor = await Vendor.findOne({ user: userId }).session(session).lean();
            if (existingVendor) {
                throw new AppError(RESPONSE_MESSAGES.VENDOR.ALREADY_EXISTS, HTTP_STATUS.CONFLICT);
            }

            const vendor = await Vendor.create([{
                user: userId,
                ownerName: data.ownerName || existingUser.name,
                businessName: data.businessName,
                isApproved: true
            }], { session });

            if (req && req.user) {
                await AuditService.logAction(req.user.id, 'CREATE', 'VENDOR', vendor[0]._id, { businessName: vendor[0].businessName }, req);
            }

            result = { user: existingUser, vendor: vendor[0] };
        });

        session.endSession();
        await this.invalidateVendorCaches();
        return result;
    }

    async updateVendor(id, data, req = null) {
        const session = await mongoose.startSession();
        let result = null;

        await session.withTransaction(async () => {
            let vendor = await Vendor.findById(id).session(session).lean();
            let user = null;

            if (vendor) {
                user = await User.findById(vendor.user).session(session).lean();
            } else {
                user = await User.findById(id).session(session).lean();
                if (user) vendor = await Vendor.findOne({ user: id }).session(session).lean();
            }

            if (!vendor && !user) {
                throw new AppError(RESPONSE_MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            const userFields = ['name', 'phone', 'status', 'isVerified', 'isVendorVerified'];
            const vendorFields = ['ownerName', 'businessName', 'address', 'bankDetails', 'documents', 'isApproved', 'isOperating', 'trustBadge'];

            const userData = {};
            const vendorUpdateData = {};

            Object.keys(data).forEach(key => {
                if (userFields.includes(key)) userData[key] = data[key];
                if (vendorFields.includes(key)) vendorUpdateData[key] = data[key];
                if (key === 'profileStatus') vendorUpdateData['status'] = data[key];
            });

            if (vendor && Object.keys(vendorUpdateData).length > 0) {
                if (data.address) {
                    vendorUpdateData.address = { ...(vendor.address || {}), ...data.address };
                    mapToGeoJSON(vendorUpdateData.address, 'location');
                }
                await Vendor.findByIdAndUpdate(vendor._id, { $set: vendorUpdateData }, { session, new: true, lean: true });
            }

            if (user && Object.keys(userData).length > 0) {
                if (data.preferences) {
                    const existing = user.preferences || {};
                    userData.preferences = { ...existing, ...data.preferences };
                }
                await User.findByIdAndUpdate(user._id, { $set: userData }, { session, new: true, lean: true });
            }

            if (req && req.user) {
                await AuditService.logAction(req.user.id, 'UPDATE', 'VENDOR', id, { changes: data }, req);
            }

            result = await User.findById(user?._id || id).populate('vendorProfile').session(session).lean();
        });

        session.endSession();
        await this.invalidateVendorCaches(id);
        return result;
    }

    async updateVendorStatus(vendorId, status, req = null) {
        const isApproved = status !== VERIFICATION_STATUS.REJECTED && status !== STATUS.SUSPENDED;
        const userStatus = isApproved ? STATUS.ACTIVE : STATUS.SUSPENDED;
        
        const session = await mongoose.startSession();
        let result = null;

        await session.withTransaction(async () => {
            let vendor = await Vendor.findById(vendorId).session(session);
            if (!vendor) vendor = await Vendor.findOne({ user: vendorId }).session(session);

            if (!vendor) throw new AppError(RESPONSE_MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

            vendor.isApproved = isApproved;
            vendor.status = isApproved ? STATUS.ACTIVE : STATUS.SUSPENDED;
            await vendor.save({ session });

            await User.findByIdAndUpdate(vendor.user, { status: userStatus }, { session });

            if (req && req.user) {
                await AuditService.logAction(req.user.id, 'UPDATE_STATUS', 'VENDOR', vendor._id, { status }, req);
            }

            result = { vendorId: vendor._id, userId: vendor.user };
        });

        session.endSession();

        // Perform side-effects outside transaction
        await BusinessService.calculateTrustBadge(result.vendorId);
        if (isApproved) NotificationService.notifyVendorApproval(result.vendorId, true);
        await this.invalidateVendorCaches(result.vendorId);

        return await User.findById(result.userId).populate('vendorProfile').lean();
    }

    async deleteVendor(id, deletedBy = null) {
        const now = new Date();
        const session = await mongoose.startSession();

        await session.withTransaction(async () => {
            let vendor = await Vendor.findById(id).session(session).lean();
            if (vendor) {
                await User.findByIdAndUpdate(vendor.user, {
                    status: STATUS.DELETED,
                    deletedAt: now,
                    deletedBy: deletedBy || null,
                    deletedReason: 'Admin initiated deletion'
                }, { session });
                await Vendor.findByIdAndUpdate(id, { isApproved: false }, { session });
            } else {
                const user = await User.findById(id).session(session).lean();
                if (user) {
                    await User.findByIdAndUpdate(id, {
                        status: STATUS.DELETED,
                        deletedAt: now,
                        deletedBy: deletedBy || null,
                        deletedReason: 'Admin initiated deletion'
                    }, { session });
                    const vendorProfile = await Vendor.findOne({ user: id }).session(session).lean();
                    if (vendorProfile) await Vendor.findByIdAndUpdate(vendorProfile._id, { isApproved: false }, { session });
                }
            }
        });

        session.endSession();
        await this.invalidateVendorCaches(id);
        return true;
    }

    // --- Verification & OCR ---

    async verifyCategoryDocument(data, req = null) {
        const { documentId, status, reason } = data;
        const session = await mongoose.startSession();
        let doc = null;

        await session.withTransaction(async () => {
            doc = await VendorDocument.findById(documentId).session(session);
            if (!doc) throw new AppError(RESPONSE_MESSAGES.VENDOR.DOCUMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

            doc.status = status;
            doc.rejection_reason = status === 'rejected' ? reason : null;
            await doc.save({ session });

            if (req && req.user) await AuditService.logAction(req.user.id, 'VERIFY', 'CATEGORY_DOCUMENT', documentId, { status }, req);
        });

        session.endSession();

        NotificationService.notifyDocumentVerification(doc.vendor, "A Category Specific Document", status === 'approved' || status === 'verified');
        return doc;
    }

    async verifyDocumentOCR(data, req = null) {
        const { vendorId, documentField, index } = data;
        let identityData = null;
        
        let vendor = await Vendor.findById(vendorId);
        if (!vendor) throw new AppError(RESPONSE_MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);

        let doc = null;
        if (Array.isArray(vendor.documents[documentField])) {
            if (typeof index !== 'number') throw new AppError(RESPONSE_MESSAGES.ERROR.INDEX_REQUIRED, HTTP_STATUS.BAD_REQUEST);
            doc = vendor.documents[documentField][index];
        } else {
            doc = vendor.documents[documentField];
        }

        if (!doc || !doc.url) throw new AppError(RESPONSE_MESSAGES.VENDOR.DOCUMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

        const optimizedUrl = doc.url.includes('cloudinary') ? doc.url.replace('/upload/', '/upload/f_jpg,q_auto/') : doc.url;
        const imgRes = await fetch(optimizedUrl);
        if (!imgRes.ok) throw new AppError(`Failed to fetch document image`, HTTP_STATUS.BAD_REQUEST);

        const buffer = Buffer.from(await imgRes.arrayBuffer());
        if (buffer.length < 100) throw new AppError(RESPONSE_MESSAGES.VENDOR.INVALID_IMAGE, HTTP_STATUS.BAD_REQUEST);

        const ocrResult = await OCRService.processDocument(buffer);

        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            identityData = {
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
                { upsert: true, session }
            );

            let vendorToUpdate = await Vendor.findById(vendorId).session(session);
            
            if (Array.isArray(vendorToUpdate.documents[documentField])) {
                vendorToUpdate.documents[documentField][index].status = 'verified';
                vendorToUpdate.documents[documentField][index].ocrData = { identifiedId: ocrResult.identifiedId, text: ocrResult.text };
            } else {
                vendorToUpdate.documents[documentField].status = 'verified';
                vendorToUpdate.documents[documentField].ocrData = { identifiedId: ocrResult.identifiedId, text: ocrResult.text };
            }

            vendorToUpdate.markModified('documents');
            vendorToUpdate.isApproved = true;
            vendorToUpdate.status = STATUS.ACTIVE;
            await vendorToUpdate.save({ session });
            
            await User.findByIdAndUpdate(vendorToUpdate.user, { status: STATUS.ACTIVE }, { session });

            if (req && req.user) await AuditService.logAction(req.user.id, 'OCR_VERIFY', 'DOCUMENT', vendorId, { docType: ocrResult.idType }, req);
        });

        session.endSession();

        await BusinessService.calculateTrustBadge(vendorId);
        await this.invalidateVendorCaches(vendorId);

        return identityData;
    }

    async verifyManualDocument(data, req = null) {
        const { vendorId, documentField, status, reason, index } = data;
        const session = await mongoose.startSession();
        
        await session.withTransaction(async () => {
            let vendor = await Vendor.findById(vendorId).session(session);
            if (!vendor) vendor = await Vendor.findOne({ user: vendorId }).session(session);
            if (!vendor) throw new AppError(RESPONSE_MESSAGES.VENDOR.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            
            const pathParts = documentField.includes('.') ? documentField.split('.') : ['documents', documentField];
            let parent = vendor;
            for (let i = 0; i < pathParts.length - 1; i++) {
                parent = parent[pathParts[i]];
                if (!parent) throw new AppError(RESPONSE_MESSAGES.VENDOR.DOCUMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            const fieldName = pathParts[pathParts.length - 1];
            let doc = parent[fieldName];

            if (!doc) {
                throw new AppError(RESPONSE_MESSAGES.VENDOR.DOCUMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
            }

            if (Array.isArray(doc)) {
                if (typeof index !== 'number') throw new AppError(RESPONSE_MESSAGES.ERROR.INDEX_REQUIRED, HTTP_STATUS.BAD_REQUEST);
                if (!doc[index]) throw new AppError(RESPONSE_MESSAGES.VENDOR.DOCUMENT_NOT_FOUND, HTTP_STATUS.NOT_FOUND);

                doc[index].status = status;
                doc[index].reason = status === 'rejected' ? reason : null;
            } else {
                doc.status = status;
                doc.reason = status === 'rejected' ? reason : null;
            }

            vendor.markModified(documentField.includes('.') ? documentField : `documents.${documentField}`);
            await vendor.save({ session });

            if (req && req.user) {
                await AuditService.logAction(req.user.id, 'VERIFY', 'DOCUMENT', vendor._id, { field: documentField, status }, req);
            }
        });

        session.endSession();

        NotificationService.notifyDocumentVerification(vendorId, documentField, status === 'verified' || status === 'approved');
        await BusinessService.calculateTrustBadge(vendorId);
        await this.invalidateVendorCaches(vendorId);

        return true;
    }
}

export default new VendorService();
