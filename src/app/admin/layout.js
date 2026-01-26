'use client';

import Sidebar from '../../components/admin/Sidebar';
import withAuth from '../../components/withAuth';

function AdminLayout({ children }) {
    // Mobile layout state could go here

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative scroll-smooth">
                {children}
            </main>
        </div>
    );
}

// Wrap layout with auth check
export default withAuth(AdminLayout, 'admin');
