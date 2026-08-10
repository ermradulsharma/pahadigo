import BookingService from '@/core/Services/Admin/BookingService.js';
import PaymentsClientWrapper from './PaymentsClientWrapper.js';

export const metadata = {
    title: 'Vendor Payouts | PahadiGo Admin',
    description: 'Manage platform vendor payouts and financial records.'
};

export default async function VendorPayoutsPage() {
    // 1. Fetch data directly via Service (Server-side)
    const rawPayments = await BookingService.getPaymentHistory();
    
    // 2. Serialize to safely pass to Client Component
    const initialPayments = JSON.parse(JSON.stringify(rawPayments || []));

    // 3. Render pure UI Shell
    return (
        <main>
            <PaymentsClientWrapper initialPayments={initialPayments} />
        </main>
    );
}
