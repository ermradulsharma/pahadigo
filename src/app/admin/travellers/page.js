import TravellerService from '@/core/Services/Admin/TravellerService.js';
import TravellersClientWrapper from './TravellersClientWrapper.js';

export const metadata = {
    title: 'Travellers | Admin Dashboard',
    description: 'Manage platform users and travellers.'
};

export default async function TravellersPage() {
    // 1. Fetch initial data from Service (Server-side)
    const rawTravellers = await TravellerService.getAllTravellers();
    
    // 2. Serialize to safely pass to Client Component (App Router requirement)
    const initialTravellers = JSON.parse(JSON.stringify(rawTravellers || []));

    // 3. Render Client Wrapper for interactive state
    return <TravellersClientWrapper initialTravellers={initialTravellers} />;
}
