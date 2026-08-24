/**
 * Category Compliance & Document Evaluation Helpers
 */

/**
 * Evaluates document compliance status and formats detailed documents list for a business category.
 * @param {Object} category - Category subdocument ({ _id, name, slug })
 * @param {Array} uploadedDocs - Vendor uploaded documents matching this category
 * @param {Array} categoryRequirements - Master category document requirements
 * @returns {Object} Formatted Category response object containing id, name, slug, documentStatus, and documents array
 */
export const evaluateCategoryDocumentStatus = (category, uploadedDocs = [], categoryRequirements = []) => {
    const catId = category._id ? category._id.toString() : (category.id || null);

    const reqDocs = categoryRequirements.filter(r => r.category_slug === category.slug);
    const catDocs = uploadedDocs.filter(d => d.category_slug === category.slug);

    const documents = [];

    // Format helper for document display names
    const getDocName = (slug, fallbackName) => {
        if (fallbackName) return fallbackName;
        const matched = reqDocs.find(r => r.slug === slug);
        if (matched && matched.name) return matched.name;
        if (!slug) return '';
        return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // 1. Map master requirements for this category
    if (reqDocs.length > 0) {
        reqDocs.forEach(reqDoc => {
            const uploaded = catDocs.find(d => d.document_slug === reqDoc.slug);
            if (!uploaded) {
                documents.push({
                    documentName: reqDoc.name || getDocName(reqDoc.slug),
                    status: 'not_uploaded',
                    url: null,
                    rejectReason: null
                });
            } else {
                documents.push({
                    documentName: reqDoc.name || getDocName(uploaded.document_slug),
                    status: uploaded.status === 'approved' ? 'verified' : (uploaded.status || 'pending'),
                    url: uploaded.url || null,
                    rejectReason: uploaded.rejection_reason || null
                });
            }
        });
    }

    // 2. Add any uploaded documents that are not in master requirements
    catDocs.forEach(uploaded => {
        const isAlreadyProcessed = documents.some(d => d.url === uploaded.url || (uploaded.document_slug && reqDocs.some(r => r.slug === uploaded.document_slug)));
        if (!isAlreadyProcessed) {
            documents.push({
                documentName: getDocName(uploaded.document_slug),
                status: uploaded.status === 'approved' ? 'verified' : (uploaded.status || 'pending'),
                url: uploaded.url || null,
                rejectReason: uploaded.rejection_reason || null
            });
        }
    });

    // 3. Determine documentStatus
    let documentStatus = 'not_uploaded';
    if (documents.length > 0) {
        const hasRejected = documents.some(d => d.status === 'rejected');
        const hasPending = documents.some(d => d.status === 'pending');
        const hasNotUploaded = documents.some(d => d.status === 'not_uploaded');

        if (hasRejected) {
            documentStatus = 'rejected';
        } else if (hasPending) {
            documentStatus = 'pending';
        } else if (!hasNotUploaded && documents.every(d => d.status === 'verified')) {
            documentStatus = 'verified';
        } else if (documents.some(d => d.status === 'verified')) {
            documentStatus = 'pending';
        } else {
            documentStatus = 'not_uploaded';
        }
    }

    return {
        id: catId,
        name: category.name,
        slug: category.slug,
        documentStatus,
        documents
    };
};

export default {
    evaluateCategoryDocumentStatus
};
