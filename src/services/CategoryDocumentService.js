import CategoryDocument from '../models/CategoryDocument.js';

class CategoryDocumentService {

    async create(data) {
        try {
            const document = new CategoryDocument(data);
            return await document.save();
        } catch (error) {
            throw error;
        }
    }

    async getAll(filter = {}) {
        try {
            return await CategoryDocument.find(filter).sort({ category_slug: 1, name: 1 });
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
            const document = await CategoryDocument.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true }
            );
            if (!document) throw new Error('Category Document not found');
            return document;
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
