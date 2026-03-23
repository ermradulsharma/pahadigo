'use client';

import Sidebar from '@/components/admin/Sidebar';
import DashboardHeader from '@/components/admin/Header';
import DashboardFooter from '@/components/admin/Footer';
import withAuth from '@/components/withAuth';

function AdminLayout({ children }) {
    return (
        <div className="flex h-screen bg-[#050505] text-slate-300 font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none z-0"></div>
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative scroll-smooth flex flex-col z-10 custom-scrollbar">
                <DashboardHeader title="Telemetry Monitor" />
                <div className="flex-1 relative">
                    {children}
                </div>
                <DashboardFooter />
            </main>
        </div>
    );
}
export default withAuth(AdminLayout, 'admin');
