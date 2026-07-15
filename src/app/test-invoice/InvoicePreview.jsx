'use client';

import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import InvoiceDocument from '@/core/Templates/Pdf/InvoiceDocument';

export default function InvoicePreview() {
    return (
        <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }}>
            <InvoiceDocument />
        </PDFViewer>
    );
}
