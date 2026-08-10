import VendorService from '@/core/Services/Admin/VendorService.js';
import VendorsClientWrapper from './VendorsClientWrapper.js';

export const metadata = {
    title: 'Vendor Network | PahadiGo Admin',
    description: 'Manage supply chain nodes and vendor clearances.'
};

export default async function VendorsPage() {
    // 1. Fetch data directly via Service (Server-side)
    const rawVendors = await VendorService.getAllVendors();
    
    // 2. Serialize to safely pass to Client Component
    const initialVendors = JSON.parse(JSON.stringify(rawVendors));

    // 3. Render pure UI Shell
    return (
        <main>
            <VendorsClientWrapper initialVendors={initialVendors} />
        </main>
    );
}
