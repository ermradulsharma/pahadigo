import BookingService from '@/core/Services/Admin/BookingService.js';
import PaymentsClientWrapper from './PaymentsClientWrapper.js';

export const metadata = {
    title: 'Vendor Payouts | PahadiGo Admin',
    description: 'Manage platform vendor payouts and financial records.'
};

export default async function VendorPayoutsPage({ searchParams }) {
    const { page, search } = await searchParams; // Next.js 15+ searchParams is a Promise
    const currentPage = parseInt(page || '1');
    const filter = { search: search || '' };

    // 1. Fetch data directly via Service (Server-side)
    const data = await BookingService.getPaymentHistory(filter, currentPage, 10);
    
    // 2. Serialize to safely pass to Client Component
    const initialPayments = JSON.parse(JSON.stringify(data.payments || []));
    const initialTotalMetadata = {
        total: data.total || 0,
        totalPages: data.totalPages || 1
    };

    // 3. Render pure UI Shell
    return (
        <main>
            <PaymentsClientWrapper 
                initialPayments={initialPayments} 
                initialTotalMetadata={initialTotalMetadata} 
            />
        </main>
    );
}
