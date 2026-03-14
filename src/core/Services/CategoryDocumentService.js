import CategoryDocument from '@/models/CategoryDocument.js';
import { RESPONSE_MESSAGES } from '@/constants/index.js';

class CategoryDocumentService {

    async create(data) {
        try {
            const document = new CategoryDocument(data);
            return await document.save();
        } catch (error) {
            throw error;
        }
    }

    async getAll(filter = {}, page = 1, limit = 10) {
        try {
            const safeLimit = Math.max(1, Math.min(parseInt(limit) || 10, 100)); // Cap to 100
            const skip = (Math.max(1, parseInt(page) || 1) - 1) * safeLimit;
            const docs = await CategoryDocument.find(filter)
                .sort({ category_slug: 1, name: 1 })
                .skip(skip)
                .limit(limit);

            const totalDocs = await CategoryDocument.countDocuments(filter);

            return {
                docs,
                totalDocs,
                limit: safeLimit,
                page: Math.max(1, parseInt(page) || 1),
                totalPages: Math.ceil(totalDocs / safeLimit)
            };
        } catch (error) {
            throw error;
        }
    }

    async getById(id) {
        try {
            const document = await CategoryDocument.findById(id);
            if (!document) throw new Error(RESPONSE_MESSAGES.ERROR.DOCUMENT_NOT_FOUND);
            return document;
        } catch (error) {
            throw error;
        }
    }

    async update(id, data) {
        try {
            const document = await CategoryDocument.findById(id.toString());

            if (!document) {
                const dbName = CategoryDocument.db.name;
                throw new Error(`Category Document not found in ${dbName}`);
            }

            // Copy properties
            Object.assign(document, data);

            return await document.save();
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        try {
            return await CategoryDocument.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }
}

const categoryDocumentService = new CategoryDocumentService();
export default categoryDocumentService;