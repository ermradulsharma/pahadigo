'use client';

import dynamic from 'next/dynamic';

// We must dynamically import the viewer with ssr: false because it relies on browser APIs to render the PDF blob
const InvoicePreview = dynamic(() => import('./InvoicePreview'), {
    ssr: false,
});

export default function TestInvoicePage() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <InvoicePreview />
        </div>
    );
}
