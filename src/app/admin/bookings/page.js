import BookingService from '@/core/Services/Admin/BookingService.js';
import BookingsClientWrapper from './BookingsClientWrapper.js';

export const metadata = {
    title: 'Bookings | PahadiGo Admin',
    description: 'Manage platform reservations and refunds.'
};

export default async function BookingsPage({ searchParams }) {
    const { page, status } = await searchParams; // In Next.js 15+, searchParams is a Promise
    const currentPage = parseInt(page || '1');
    const filterStatus = status || 'all';

    // Fetch data directly via Service (Server-side)
    const data = await BookingService.getAllBookings({ status: filterStatus }, currentPage, 10);
    
    // Serialize to safely pass to Client Component
    const initialBookings = JSON.parse(JSON.stringify(data.bookings || []));
    const initialTotalMetadata = {
        total: data.total || 0,
        totalPages: data.totalPages || 1
    };

    // Render pure UI Shell
    return (
        <main>
            <BookingsClientWrapper 
                initialBookings={initialBookings} 
                initialTotalMetadata={initialTotalMetadata} 
            />
        </main>
    );
}
