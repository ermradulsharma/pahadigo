'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const InvoiceViewer = dynamic(() => import('./InvoiceViewer'), {
    ssr: false,
});

export default function InvoicePreview({ booking }) {
    return <InvoiceViewer booking={booking} />;
}
