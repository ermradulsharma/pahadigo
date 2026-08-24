/**
 * Category Compliance & Document Evaluation Helpers
 */

/**
 * Evaluates document compliance status for a business category.
 * @param {Object} category - Category subdocument ({ _id, name, slug })
 * @param {Array} uploadedDocs - Vendor uploaded documents matching this category
 * @param {Array} categoryRequirements - Master category document requirements
 * @returns {Object} Formatted Category response object containing status, documentName, and rejectReason
 */
export const evaluateCategoryDocumentStatus = (category, uploadedDocs = [], categoryRequirements = []) => {
    const catId = category._id ? category._id.toString() : null;

    const baseCategory = {
        _id: category._id,
        id: catId || category._id,
        name: category.name,
        slug: category.slug
    };

    const formatDocName = (slug) => {
        const matched = categoryRequirements.find(r => r.slug === slug);
        if (matched && matched.name) return matched.name;
        if (!slug) return '';
        return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // 1. Check for rejected document(s)
    const rejectedDocs = uploadedDocs.filter(d => d.status === 'rejected');
    if (rejectedDocs.length > 0) {
        const names = [...new Set(rejectedDocs.map(d => formatDocName(d.document_slug)))].join(', ');
        const reasons = [...new Set(rejectedDocs.map(d => d.rejection_reason || 'Document is not valid'))].join(', ');
        return {
            ...baseCategory,
            documentStatus: 'rejected',
            documentName: names,
            rejectReason: reasons
        };
    }

    // 2. Check for pending document(s)
    const pendingDocs = uploadedDocs.filter(d => d.status === 'pending');
    if (pendingDocs.length > 0) {
        const names = [...new Set(pendingDocs.map(d => formatDocName(d.document_slug)))].join(', ');
        return {
            ...baseCategory,
            documentStatus: 'pending',
            documentName: names
        };
    }

    // 3. Check if all uploaded documents are verified/approved
    if (uploadedDocs.length > 0 && uploadedDocs.every(d => d.status === 'verified' || d.status === 'approved')) {
        return {
            ...baseCategory,
            documentStatus: 'verified'
        };
    }

    // 4. Default for unsubmitted or missing documents (Not Uploaded)
    return {
        ...baseCategory,
        documentStatus: 'Not Uploaded'
    };
};

export default {
    evaluateCategoryDocumentStatus
};
