import CategoryDocumentService from '@/core/Services/Admin/CategoryDocumentService.js';
import CategoryService from '@/core/Services/Admin/CategoryService.js';
import CategoryDocClientWrapper from './CategoryDocClientWrapper.js';

export const metadata = {
    title: 'Category Documents | Admin Dashboard',
    description: 'Manage validation documents for categories.'
};

export default async function CategoryDocumentsPage() {
    // 1. Fetch initial data from Service (Server-side) in parallel
    const [rawDocumentsData, rawCategories] = await Promise.all([
        CategoryDocumentService.getAll({ limit: 100 }),
        CategoryService.listAllCategories()
    ]);
    
    // 2. Serialize to safely pass to Client Component
    const initialDocuments = JSON.parse(JSON.stringify(rawDocumentsData?.docs || []));
    const initialCategories = JSON.parse(JSON.stringify(rawCategories || []));

    // 3. Render Client Wrapper
    return <CategoryDocClientWrapper initialDocuments={initialDocuments} initialCategories={initialCategories} />;
}
