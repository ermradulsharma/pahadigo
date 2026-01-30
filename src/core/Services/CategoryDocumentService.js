import CategoryDocument from '@/models/CategoryDocument.js';

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
            const skip = (page - 1) * limit;
            const docs = await CategoryDocument.find(filter)
                .sort({ category_slug: 1, name: 1 })
                .skip(skip)
                .limit(limit);

            const totalDocs = await CategoryDocument.countDocuments(filter);

            return {
                docs,
                totalDocs,
                limit,
                page,
                totalPages: Math.ceil(totalDocs / limit)
            };
        } catch (error) {
            throw error;
        }
    }

    async getById(id) {
        try {
            const document = await CategoryDocument.findById(id);
            if (!document) throw new Error('Category Document not found');
            return document;
        } catch (error) {
            throw error;
        }
    }

    async update(id, data) {
        try {
            const document = await CategoryDocument.findById(id.trim());

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