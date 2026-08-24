import Vendor from '@/core/Models/Vendor.js';
import Category from '@/core/Models/Category.js';
import CategoryDocument from '@/core/Models/CategoryDocument.js';
import VendorDocument from '@/core/Models/VendorDocument.js';
import { uploadToCloudinary } from '@/core/Helpers/cloudinary.js';
import { RESPONSE_MESSAGES, VERIFICATION_STATUS } from '@/core/Constants/index.js';
import CacheService from '@/core/Services/CacheService.js';
import { getBusinessByUserId, getVendorDocumentsBy } from '@/core/Helpers/queryHelpers.js';
import { evaluateCategoryDocumentStatus } from '@/core/Helpers/categoryHelper.js';

/**
 * CategoryService (Vendor Scope) - Facilitates the lifecycle of business
 * classification and category-specific compliance.
 */
class CategoryService {

    // Helper to invalidate vendor profile caches
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

    // List categories currently assigned to the vendor along with document status summary
    async getAssignedCategories(userId) {
        const vendor = await getBusinessByUserId(userId);
        if (!vendor || !vendor.category || vendor.category.length === 0) return [];

        const assignedSlugs = vendor.category.map(c => c.slug);
        const dbCategories = await Category.find({ slug: { $in: assignedSlugs } }).select('_id name slug').lean();
        const docs = await getVendorDocumentsBy({ user: userId, vendor: vendor._id }, 'category_slug document_slug url status rejection_reason issue_date expiry_date createdAt');
        const categoryReqs = await CategoryDocument.find({ isActive: true }).select('name slug category_slug').lean();

        return vendor.category.map(cat => {
            const dbCat = dbCategories.find(c => c.slug === cat.slug);
            const categoryObj = {
                _id: dbCat?._id || cat._id || cat.id,
                name: dbCat?.name || cat.name,
                slug: cat.slug
            };
            const catDocs = docs.filter(d => d.category_slug === cat.slug);
            const catReqs = categoryReqs.filter(r => r.category_slug === cat.slug);
            return evaluateCategoryDocumentStatus(categoryObj, catDocs, catReqs);
        });
    }

    // Assign a new business category to vendor profile
    async assignCategoryToVendor(userId, categoryData) {
        const slug = categoryData.slug || categoryData;

        // Fetch category from database instead of constants
        const categoryDoc = await Category.findOne({ slug, isActive: true });
        if (!categoryDoc) {
            throw new Error(RESPONSE_MESSAGES.CATEGORY.INVALID);
        }

        // Check if vendor profile exists
        const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
        if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);

        // Check if vendor already has this category assigned
        const isDuplicate = vendor.category?.some(c => c.slug === slug);
        if (isDuplicate) {
            throw new Error(RESPONSE_MESSAGES.CATEGORY.ALREADY_ASSIGNED);
        }

        vendor.category.push({
            slug: categoryDoc.slug,
            name: categoryDoc.name
        });

        const saved = await vendor.save();
        await this.invalidateVendorCaches(userId, vendor._id);
        return saved;
    }

    // Remove a business category from vendor profile
    async removeCategoryFromVendor(userId, categorySlug) {
        const vendor = await Vendor.findOneAndUpdate(
            { user: userId, deletedAt: null },
            { $pull: { category: { slug: categorySlug } } },
            { returnDocument: 'after' }
        );
        if (vendor) {
            await this.invalidateVendorCaches(userId, vendor._id);
        }
        return vendor;
    }

    // Get list of categories that the vendor hasn't chosen yet
    async getEligibleCategories(userId) {
        const allCategories = await Category.find({ isActive: true }).select('name slug description');
        const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
        const assignedSlugs = vendor?.category?.map(c => c.slug) || [];
        return allCategories.filter(category => !assignedSlugs.includes(category.slug));
    }

    // Get real document requirements for a specific category (Only if assigned)
    async getDocuments(userId, categorySlug) {
        const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
        const isAssigned = vendor?.category?.some(c => c.slug === categorySlug);
        if (!isAssigned) {
            throw new Error(RESPONSE_MESSAGES.CATEGORY.NOT_ASSIGNED);
        }
        return await this.getRequirementsBySlug(categorySlug);
    }

    // Get list of required documents for any category (Bypasses assignment check)
    async getRequirementsBySlug(categorySlug) {
        const dbDocs = await CategoryDocument.find({ category_slug: categorySlug, isActive: true }).select('name slug isMandatory');
        return dbDocs;
    }

    // Submit/Upload documents for a specific category
    async uploadDocuments(userId, categorySlug, req) {
        const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
        const isAssigned = vendor?.category?.some(c => c.slug === categorySlug);
        if (!isAssigned) {
            throw new Error(RESPONSE_MESSAGES.CATEGORY.NOT_ASSIGNED);
        }

        const payload = req.payload;
        const documentSlugs = Array.isArray(payload.document_slug) ? payload.document_slug : (payload.document_slug ? [payload.document_slug] : []);
        const images = Array.isArray(payload.image) ? payload.image : (payload.image ? [payload.image] : []);
        const issueDates = Array.isArray(payload.issue_date) ? payload.issue_date : (payload.issue_date ? [payload.issue_date] : []);
        const expiryDates = Array.isArray(payload.expiry_date) ? payload.expiry_date : (payload.expiry_date ? [payload.expiry_date] : []);

        if (documentSlugs.length === 0 || images.length === 0 || documentSlugs.length !== images.length) {
            throw new Error(RESPONSE_MESSAGES.CATEGORY.DOC_MISMATCH);
        }

        const uploadPromises = documentSlugs.map(async (docSlug, index) => {
            const imageFile = images[index];
            const issueDate = issueDates[index];
            const expiryDate = expiryDates[index];
            if (!imageFile) return null;

            const currentIssueDate = issueDate ? new Date(issueDate) : null;
            const currentExpiryDate = expiryDate ? new Date(expiryDate) : null;

            // 1. Upload to Cloudinary
            const uploadResult = await uploadToCloudinary(imageFile, `vendor/docs/${userId}/${categorySlug}`);

            // 2. Persist to VendorDocument (Identify by Vendor + Category + Doc Slug)
            return await VendorDocument.findOneAndUpdate(
                {
                    user: userId,
                    vendor: vendor._id,
                    document_slug: docSlug,
                    category_slug: categorySlug,
                },
                {
                    user: userId,
                    vendor: vendor._id,
                    category_slug: categorySlug,
                    url: uploadResult.url,
                    issue_date: currentIssueDate,
                    expiry_date: currentExpiryDate,
                    status: VERIFICATION_STATUS.PENDING
                },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
        });

        const results = await Promise.all(uploadPromises);
        await this.invalidateVendorCaches(userId, vendor._id);
        return results.filter(Boolean);
    }

    // Get list of all documents already uploaded by the vendor across all categories
    async getUploadedDocuments(userId) {
        const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
        if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
        return await VendorDocument.find({
            user: userId,
            vendor: vendor._id
        }).select('category_slug document_slug url status rejection_reason createdAt');
    }
}

export default new CategoryService();
