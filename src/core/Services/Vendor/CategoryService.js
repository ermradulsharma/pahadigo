import Vendor from '@/models/Vendor.js';
import Category from '@/models/Category.js';
import CategoryDocument from '@/models/CategoryDocument.js';
import VendorDocument from '@/models/VendorDocument.js';
import { uploadToCloudinary } from '@/helpers/cloudinary.js';
import { RESPONSE_MESSAGES, VERIFICATION_STATUS } from '@/constants/index.js';

/**
 * CategoryService (Vendor Scope) - Facilitates the lifecycle of business
 * classification and category-specific compliance.
 */
class CategoryService {

  // List categories currently assigned to the vendor
  async getAssignedCategories(userId) {
    const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
    return vendor?.category || [];
  }

  // Assign a new business category to vendor profile
  async assignCategoryToVendor(userId, categoryData) {
    const slug = categoryData.slug || categoryData;

    // Fetch category from database instead of constants
    const categoryDoc = await Category.findOne({ slug, isActive: true });
    if (!categoryDoc) {
      throw new Error(RESPONSE_MESSAGES.ERROR.INVALID_CATEGORY);
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

    return await vendor.save();
  }

  // Remove a business category from vendor profile
  async removeCategoryFromVendor(userId, categorySlug) {
    return await Vendor.findOneAndUpdate(
      { user: userId, deletedAt: null },
      { $pull: { category: { slug: categorySlug } } },
      { returnDocument: 'after' }
    );
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
      throw new Error("This category is not yet part of your business profile. Please add it first.");
    }
    return await CategoryDocument.find({ category_slug: categorySlug, isActive: true }).select('name slug isMandatory');
  }

  // Submit/Upload documents for a specific category
  async uploadDocuments(userId, categorySlug, req) {
    const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
    const isAssigned = vendor?.category?.some(c => c.slug === categorySlug);
    if (!isAssigned) {
      throw new Error("This category is not yet part of your business profile. Please add it first.");
    }

    const payload = req.payload;
    const documentSlugs = Array.isArray(payload.document_slug) ? payload.document_slug : (payload.document_slug ? [payload.document_slug] : []);
    const images = Array.isArray(payload.image) ? payload.image : (payload.image ? [payload.image] : []);

    if (documentSlugs.length === 0 || images.length === 0 || documentSlugs.length !== images.length) {
      throw new Error("Mismatch between document identifiers and files provided.");
    }

    const uploadPromises = documentSlugs.map(async (docSlug, index) => {
      const imageFile = images[index];
      if (!imageFile) return null;

      // 1. Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(imageFile, `vendor/docs/${userId}/${categorySlug}`);

      // 2. Persist to VendorDocument (Identify by Vendor + Doc Slug, update User ID if missing)
      return await VendorDocument.findOneAndUpdate(
        {
          vendor_id: vendor._id,
          document_slug: docSlug
        },
        {
          user_id: userId, // Ensure user_id is updated/set
          category_slug: categorySlug,
          url: uploadResult.url,
          status: VERIFICATION_STATUS.PENDING
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    });

    const results = await Promise.all(uploadPromises);
    return results.filter(Boolean);
  }

  // Get list of all documents already uploaded by the vendor across all categories
  async getUploadedDocuments(userId) {
    const vendor = await Vendor.findOne({ user: userId, deletedAt: null });
    if (!vendor) throw new Error(RESPONSE_MESSAGES.VENDOR.NOT_FOUND);
    return await VendorDocument.find({
      user_id: userId,
      vendor_id: vendor._id
    }).select('category_slug document_slug url status rejection_reason createdAt');
  }
}

export default new CategoryService();
