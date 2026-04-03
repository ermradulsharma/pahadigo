'use client';
import withAuth from '@/components/withAuth';
import Link from 'next/link';

function TravellerLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen bg-[#0a0a0c] text-white">
            <header className="px-6 py-4 border-b border-indigo-500/20 flex justify-between items-center bg-[#0d0d12]">
                <h1 className="text-xl font-bold tracking-tight text-white mb-0 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">PahadiGo</h1>
                <div className="flex gap-6  text-sm font-mono tracking-widest uppercase">
                    <Link href="/" className="hover:text-indigo-400 transition-colors">Home</Link>
                    <Link href="/traveller" className="hover:text-indigo-400 transition-colors">My Profile</Link>
                    <Link href="/traveller/bookings" className="hover:text-indigo-400 transition-colors text-slate-400">Bookings</Link>
                </div>
            </header>
            <main className="flex-1 p-8 bg-[#0a0a0c]">
                {children}
            </main>
        </div>
    );
}

export default withAuth(TravellerLayout, ['traveller']);
