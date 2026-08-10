import CategoryService from '@/core/Services/Admin/CategoryService.js';
import CategoriesClientWrapper from './CategoriesClientWrapper.js';

export const metadata = {
    title: 'Categories | Admin Dashboard',
    description: 'Manage activity categories and taxonomy.'
};

export default async function CategoriesPage() {
    // 1. Fetch initial data from Service (Server-side)
    const rawCategories = await CategoryService.listAllCategories();
    
    // 2. Serialize to safely pass to Client Component
    const initialCategories = JSON.parse(JSON.stringify(rawCategories || []));

    // 3. Render Client Wrapper
    return <CategoriesClientWrapper initialCategories={initialCategories} />;
}
