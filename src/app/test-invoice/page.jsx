import InvoicePreview from './InvoicePreview';
import connectDB from '@/core/Config/db';
import Booking from '@/core/Models/Booking';

export default async function TestInvoicePage() {
    await connectDB();
    
    // Fetch the latest booking to test with real data
    const latestBooking = await Booking.findOne()
        .sort({ createdAt: -1 })
        .populate('user')
        .populate('vendor')
        .lean();
        
    // Convert DB object to plain JSON to pass from Server Component to Client Component
    const serializedBooking = latestBooking ? JSON.parse(JSON.stringify(latestBooking)) : null;

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <InvoicePreview booking={serializedBooking} />
        </div>
    );
}
