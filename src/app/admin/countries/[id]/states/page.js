import LocationService from '@/core/Services/Admin/LocationService.js';
import StatesClientWrapper from './StatesClientWrapper.js';

export async function generateMetadata({ params }) {
    const { id } = await params;
    try {
        const country = await LocationService.getCountryById(id);
        return {
            title: `${country?.name || 'Regions'} | Admin Dashboard`,
            description: `Manage regions for ${country?.name || 'country'}`
        };
    } catch (e) {
        return { title: 'Regions | Admin Dashboard' };
    }
}

export default async function StatesPage({ params }) {
    const { id } = await params;
    
    // Fetch initial data from Service (Server-side) in parallel
    let rawStates = [];
    let rawCountry = null;
    
    try {
        const [statesData, countryData] = await Promise.all([
            LocationService.listStates(id),
            LocationService.getCountryById(id)
        ]);
        rawStates = statesData;
        rawCountry = countryData;
    } catch (e) {
        // Handle gracefully
    }
    
    // Serialize to safely pass to Client Component
    const initialStates = JSON.parse(JSON.stringify(rawStates || []));
    const country = JSON.parse(JSON.stringify(rawCountry || null));

    return <StatesClientWrapper initialStates={initialStates} country={country} />;
}
