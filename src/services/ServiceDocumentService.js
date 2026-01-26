import ServiceDocument from '../models/ServiceDocument.js';

class ServiceDocumentService {

    async create(data) {
        try {
            const document = new ServiceDocument(data);
            return await document.save();
        } catch (error) {
            throw error;
        }
    }

    async getAll(filter = {}) {
        try {
            return await ServiceDocument.find(filter).sort({ category_slug: 1, name: 1 });
        } catch (error) {
            throw error;
        }
    }

    async getById(id) {
        try {
            const document = await ServiceDocument.findById(id);
            if (!document) throw new Error('Service Document not found');
            return document;
        } catch (error) {
            throw error;
        }
    }

    async update(id, data) {
        try {
            const document = await ServiceDocument.findByIdAndUpdate(
                id,
                data,
                { new: true, runValidators: true }
            );
            if (!document) throw new Error('Service Document not found');
            return document;
        } catch (error) {
            throw error;
        }
    }

    async delete(id) {
        try {
            return await ServiceDocument.findByIdAndDelete(id);
        } catch (error) {
            throw error;
        }
    }
}

const serviceDocumentService = new ServiceDocumentService();
export default serviceDocumentService;
