import PolicyService from '@/core/Services/Admin/PolicyService.js';
import BookingService from '@/core/Services/Admin/BookingService.js';
import SupportClientWrapper from './SupportClientWrapper.js';

export const metadata = {
    title: 'Support & Inquiries | Admin Dashboard',
    description: 'Manage platform support, inquiries, and disputes.'
};

export default async function SupportPage() {
    // 1. Fetch initial data from Service (Server-side) in parallel
    let rawInquiries = [];
    let rawDisputes = [];
    
    try {
        const [inquiriesData, disputesData] = await Promise.all([
            PolicyService.getInquiries(),
            BookingService.getDisputes({}, 1, 100)
        ]);
        rawInquiries = inquiriesData;
        rawDisputes = disputesData?.disputes || [];
    } catch (e) {
        // Handle gracefully
    }
    
    // 2. Serialize to safely pass to Client Component
    const initialInquiries = JSON.parse(JSON.stringify(rawInquiries || []));
    const initialDisputes = JSON.parse(JSON.stringify(rawDisputes || []));

    // 3. Render Client Wrapper
    return <SupportClientWrapper initialInquiries={initialInquiries} initialDisputes={initialDisputes} />;
}
