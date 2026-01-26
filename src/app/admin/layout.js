'use client';

import Sidebar from '../../components/admin/Sidebar';
import DashboardHeader from '../../components/admin/Header';
import DashboardFooter from '../../components/admin/Footer';
import withAuth from '../../components/withAuth';

function AdminLayout({ children }) {
    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative scroll-smooth flex flex-col">
                <DashboardHeader title="Dashboard" />
                <div className="flex-1">
                    {children}
                </div>
                <DashboardFooter />
            </main>
        </div>
    );
}
export default withAuth(AdminLayout, 'admin');
