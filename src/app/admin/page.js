'use client';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, vendors: 0, bookings: 0, revenue: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/admin/stats', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats || data); // Handle { stats: ... } or direct obj
                }
            } catch (e) { console.error(e); }
        };

        fetchStats();
    }, []);

    return (
        <>
            <header className="bg-white shadow p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
                <p className="text-gray-500 mt-1">Welcome back, Admin</p>
            </header>

            <div className="px-8 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard title="Total Users" value={stats.users} color="bg-gradient-to-r from-blue-500 to-blue-600" icon="users" />
                    <StatCard title="Active Vendors" value={stats.vendors} color="bg-gradient-to-r from-green-500 to-green-600" icon="briefcase" />
                    <StatCard title="Bookings" value={stats.bookings} color="bg-gradient-to-r from-purple-500 to-purple-600" icon="ticket" />
                    <StatCard title="Revenue" value={`$${stats.revenue}`} color="bg-gradient-to-r from-amber-500 to-amber-600" icon="cash" />
                </div>

                {/* Can add charts or recent activity here later */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-bold mb-4 text-gray-700">Quick Actions</h2>
                    <div className="flex gap-4">
                        <a href="/admin/vendors" className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition">Manage Vendors</a>
                        <a href="/admin/bookings" className="px-4 py-2 bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition">View Bookings</a>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatCard({ title, value, color, icon }) {
    return (
        <div className={`p-6 rounded-xl shadow-lg text-white ${color} transition-transform hover:scale-105`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-sm font-medium opacity-80 uppercase tracking-wider">{title}</h3>
                    <p className="text-4xl font-bold mt-2">{value}</p>
                </div>
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    {/* Simple Icon Placeholders based on prop */}
                    {icon === 'users' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    {icon === 'briefcase' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    {icon === 'ticket' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
                    {icon === 'cash' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </div>
            </div>
        </div>
    );
}
