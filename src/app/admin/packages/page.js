import PackageService from '@/core/Services/Admin/PackageService.js';
import CategoryService from '@/core/Services/Admin/CategoryService.js';
import VendorService from '@/core/Services/Admin/VendorService.js';
import PackagesClientWrapper from './PackagesClientWrapper.js';

export const metadata = {
    title: 'Packages Inventory | PahadiGo Admin',
    description: 'Manage platform packages and inventory.'
};

export default async function PackagesPage() {
    // 1. Fetch data directly via Services (Server-side)
    const [rawPackages, rawCategories, rawVendors] = await Promise.all([
        PackageService.getAllServices(),
        CategoryService.listAllCategories(),
        VendorService.getAllVendors()
    ]);
    
    // 2. Serialize to safely pass to Client Component
    const initialPackages = JSON.parse(JSON.stringify(rawPackages || []));
    const initialCategories = JSON.parse(JSON.stringify(rawCategories || []));
    const initialVendors = JSON.parse(JSON.stringify(rawVendors || []));

    // 3. Render pure UI Shell
    return (
        <main>
            <PackagesClientWrapper 
                initialPackages={initialPackages} 
                initialCategories={initialCategories}
                initialVendors={initialVendors}
            />
        </main>
    );
}
