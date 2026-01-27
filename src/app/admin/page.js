"use client";
import { useEffect, useState } from 'react';
import { getToken } from '../../helpers/authUtils';
import Link from 'next/link';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, totalVendors: 0, pendingVendors: 0, packages: 0, categories: 0, revenue: 0, recentBookings: [], recentVendors: [] });
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    // Analytics State
    const [period, setPeriod] = useState('monthly');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setAnalyticsLoading(true);
            try {
                const token = getToken();
                const res = await fetch(`/api/admin/analytics?period=${period}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) setAnalyticsData(result.data.analytics);
            } catch (e) { console.error(e); }
            finally { setAnalyticsLoading(false); }
        };

        if (isMounted) fetchAnalytics();
    }, [period, isMounted]);

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
        <div className="p-8">
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard title="Travellers" value={stats.users || 0} color="bg-gradient-to-br from-blue-600 to-indigo-700" icon="users" />
                    <StatCard title="Vendors" value={stats.totalVendors || 0} color="bg-gradient-to-br from-emerald-500 to-teal-700" icon="briefcase" />
                    <StatCard title="Pending Approval" value={stats.pendingVendors || 0} color="bg-gradient-to-br from-amber-500 to-orange-600" icon="alert" />
                    <StatCard title="Packages" value={stats.packages || 0} color="bg-gradient-to-br from-pink-500 to-rose-700" icon="package" />
                    <StatCard title="Categories" value={stats.categories || 0} color="bg-gradient-to-br from-slate-600 to-slate-800" icon="folder" />
                    <StatCard title="Revenue" value={`₹${(Number(stats.revenue) || 0).toLocaleString('en-IN')}`} color="bg-gradient-to-br from-green-600 to-green-800" icon="cash" />
                </div>
            )}

            {/* Analytics Section */}
            <div className="mt-8 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Analytics Overview</h2>
                    <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
                        {['weekly', 'monthly', 'yearly'].map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${period === p ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}> {p} </button>
                        ))}
                    </div>
                </div>

                {analyticsLoading ? (
                    <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
                ) : analyticsData ? (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            {/* Revenue Trend */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Trend</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={analyticsData.revenueData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Booking Status */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">Booking Distribution</h3>
                                <div className="h-64 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={analyticsData.bookingStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" >
                                                {analyticsData.bookingStatus.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* User Growth */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                                <h3 className="text-lg font-bold text-gray-800 mb-6">User Growth</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData.userGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="_id" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} name="New Users" barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Vendors */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Top Performing Vendors</h3>
                                <div className="space-y-4">
                                    {analyticsData.topVendors.length === 0 ? <p className="text-sm text-gray-400 italic">No data available</p> :
                                        analyticsData.topVendors.map((vendor, i) => (
                                            <div key={i} className="flex items-center gap-3 pb-3 border-b last:border-0 border-gray-50">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">#{i + 1}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-gray-800 truncate">{vendor.name}</div>
                                                    <div className="text-xs text-gray-400">{vendor.bookings} bookings</div>
                                                </div>
                                                <div className="text-sm font-bold text-indigo-600">₹{vendor.revenue.toLocaleString()}</div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-10 text-center text-gray-500">Failed to load analytics data</div>
                )}
            </div>

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

            <div className="mt-8 bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Quick Actions</h2>
                <div className="flex flex-wrap gap-2">
                    <Link href="/admin/vendors" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium">Review Vendors</Link>
                    <Link href="/admin/travellers" className="px-6 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium">Manage Travellers</Link>
                    <Link href="/admin/categories" className="px-6 py-2.5 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition font-medium">Categories</Link>
                    <Link href="/admin/bookings" className="px-6 py-2.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium">Bookings</Link>
                </div>
            </div>
        </div>
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
                <div className="p-2 bg-opacity-20 rounded-lg">
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
