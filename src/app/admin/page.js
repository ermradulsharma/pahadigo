"use client";
import { useEffect, useState } from 'react';
import { getToken } from '../../helpers/authUtils';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, totalVendors: 0, pendingVendors: 0, packages: 0, categories: 0, revenue: 0, recentBookings: [], recentVendors: [] });
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const fetchStats = async () => {
            try {
                const token = getToken();
                const res = await fetch('/api/admin/stats', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    const resData = await res.json();
                    if (resData.success && resData.data?.stats) {
                        setStats(resData.data.stats);
                    }
                }
            } catch (e) {
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (!isMounted) return null;

    return (
        <>
            <header className="bg-white shadow p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">System Overview</h1>
                <p className="text-gray-500 mt-1">Real-time statistics for your platform</p>
            </header>

            <div className="px-8 pb-8">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <StatCard title="Travellers" value={stats.users || 0} color="bg-gradient-to-br from-blue-600 to-indigo-700" icon="users" />
                        <StatCard title="Total Vendors" value={stats.totalVendors || 0} color="bg-gradient-to-br from-emerald-500 to-teal-700" icon="briefcase" />
                        <StatCard title="Pending Appr." value={stats.pendingVendors || 0} color="bg-gradient-to-br from-amber-500 to-orange-600" icon="alert" />
                        <StatCard title="Packages" value={stats.packages || 0} color="bg-gradient-to-br from-pink-500 to-rose-700" icon="package" />
                        <StatCard title="Categories" value={stats.categories || 0} color="bg-gradient-to-br from-slate-600 to-slate-800" icon="folder" />
                        <StatCard title="Total Revenue" value={`₹${(Number(stats.revenue) || 0).toLocaleString('en-IN')}`} color="bg-gradient-to-br from-green-600 to-green-800" icon="cash" />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    {/* Recent Bookings */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-2 h-6 bg-violet-500 rounded-full"></span>
                                Recent Bookings
                            </h2>
                            <Link href="/admin/bookings" className="text-xs text-indigo-600 hover:underline font-bold">View All →</Link>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="text-gray-400 font-medium border-b border-gray-50">
                                    <tr>
                                        <th className="pb-3 px-2">Traveller</th>
                                        <th className="pb-3 px-2">Package</th>
                                        <th className="pb-3 px-2 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(stats.recentBookings || []).map((b, i) => (
                                        <tr key={b?._id || i} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-2 font-medium text-gray-700">{b?.user?.name || 'Anonymous'}</td>
                                            <td className="py-3 px-2 text-gray-600 truncate max-w-[150px]">
                                                <Link href="/admin/bookings" className="hover:text-indigo-600">{b?.package?.title || 'Package'}</Link>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${b?.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {b?.status || 'pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats.recentBookings || stats.recentBookings.length === 0) && (
                                        <tr><td colSpan="3" className="py-4 text-center text-gray-400">No recent bookings</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Vendors */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                                New Vendors
                            </h2>
                            <Link href="/admin/vendors" className="text-xs text-indigo-600 hover:underline font-bold">View All →</Link>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="text-gray-400 font-medium border-b border-gray-50">
                                    <tr>
                                        <th className="pb-3 px-2">Business</th>
                                        <th className="pb-3 px-2">Action</th>
                                        <th className="pb-3 px-2 text-right">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(stats.recentVendors || []).map((v, i) => (
                                        <tr key={v?._id || i} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-2 font-medium text-gray-700">
                                                <div>{v?.businessName || 'New Business'}</div>
                                                <div className="text-[10px] text-gray-400 -mt-1">{v?.user?.email || 'N/A'}</div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <Link
                                                    href={`/admin/vendors/${v?._id || '#'}`}
                                                    className="text-indigo-600 hover:text-indigo-800 font-bold"
                                                >
                                                    Review
                                                </Link>
                                            </td>
                                            <td className="py-3 px-2 text-right text-gray-400 italic">
                                                {v?.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!stats.recentVendors || stats.recentVendors.length === 0) && (
                                        <tr><td colSpan="3" className="py-4 text-center text-gray-400">No new vendors</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">Quick Actions</h2>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/admin/vendors" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium">Review Vendors</Link>
                        <Link href="/admin/travellers" className="px-6 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium">Manage Travellers</Link>
                        <Link href="/admin/categories" className="px-6 py-2.5 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition font-medium">Categories</Link>
                        <Link href="/admin/bookings" className="px-6 py-2.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium">Bookings</Link>
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
                    {icon === 'alert' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    {icon === 'package' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    {icon === 'folder' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
                    {icon === 'ticket' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
                    {icon === 'cash' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                </div>
            </div>
        </div>
    );
}
