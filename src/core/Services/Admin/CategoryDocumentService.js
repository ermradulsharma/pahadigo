import CategoryDocument from '@/core/Models/CategoryDocument.js';
import { RESPONSE_MESSAGES } from '@/core/Constants/index.js';
import CacheService from '@/core/Services/CacheService.js';
import AppError from '@/core/Helpers/AppError.js';

/**
 * CategoryDocumentService (Admin Role)
 * Administration of specialized documentation taxonomy for activities (e.g., license types, safety certs).
 */
class CategoryDocumentService {

  async create(data) {
    const document = new CategoryDocument(data);
    await document.save();
    await CacheService.deletePattern('admin:category-docs:*');
    return document;
  }

  async getAll(filter = {}, page = 1, limit = 10) {
    const safeLimit = Math.max(1, Math.min(parseInt(limit) || 10, 100));
    const safePage = Math.max(1, parseInt(page) || 1);
    
    // Convert filter to string for cache key
    const filterKey = Object.keys(filter).length > 0 ? JSON.stringify(filter) : 'all';
    const cacheKey = `admin:category-docs:${filterKey}:p${safePage}:l${safeLimit}`;
    
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const skip = (safePage - 1) * safeLimit;
    const docs = await CategoryDocument.find(filter)
      .sort({ category_slug: 1, name: 1 })
      .skip(skip)
      .limit(safeLimit)
      .lean();

    const totalDocs = await CategoryDocument.countDocuments(filter);

    const result = {
      docs,
      totalDocs,
      limit: safeLimit,
      page: safePage,
      totalPages: Math.ceil(totalDocs / safeLimit)
    };
    
    await CacheService.set(cacheKey, result, 300);
    return result;
  }

  async getById(id) {
    const document = await CategoryDocument.findById(id).lean();
    if (!document) throw new AppError(RESPONSE_MESSAGES.VENDOR.DOCUMENT_NOT_FOUND, 404);
    return document;
  }

  async update(id, data) {
    const document = await CategoryDocument.findById(id);
    if (!document) throw new AppError(RESPONSE_MESSAGES.VENDOR.DOCUMENT_NOT_FOUND, 404);

    Object.assign(document, data);
    await document.save();
    await CacheService.deletePattern('admin:category-docs:*');
    return document;
  }

  async delete(id) {
    const deleted = await CategoryDocument.findByIdAndDelete(id);
    await CacheService.deletePattern('admin:category-docs:*');
    return deleted;
  }
}

export default new CategoryDocumentService();
