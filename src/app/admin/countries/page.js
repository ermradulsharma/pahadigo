import LocationService from '@/core/Services/Admin/LocationService.js';
import CountriesClientWrapper from './CountriesClientWrapper.js';

export const metadata = {
    title: 'Countries | Admin Dashboard',
    description: 'Manage global territories and geographic data.'
};

export default async function CountriesPage() {
    // 1. Fetch initial data from Service (Server-side)
    const rawCountries = await LocationService.listCountries();
    
    // 2. Serialize to safely pass to Client Component
    const initialCountries = JSON.parse(JSON.stringify(rawCountries || []));

    // 3. Render Client Wrapper
    return <CountriesClientWrapper initialCountries={initialCountries} />;
}
