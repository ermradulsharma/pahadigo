'use client';
import withAuth from '@/components/withAuth.js';
import Link from 'next/link';

function VendorLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen bg-[#0a0a0c] text-slate-300">
            <header className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#111116]">
                <h1 className="text-xl font-bold text-white">Vendor Dashboard</h1>
                <div className="flex gap-4">
                    <Link href="/vendor" className="text-sm hover:text-white transition-colors">Dashboard</Link>
                    <Link href="/vendor/profile" className="text-sm hover:text-white transition-colors">Business Profile</Link>
                    <Link href="/" className="text-sm hover:text-white transition-colors">View Website</Link>
                </div>
            </header>
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    );
}

export default withAuth(VendorLayout, ['vendor']);
