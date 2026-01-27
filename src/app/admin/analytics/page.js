'use client';

import { useState, useEffect } from 'react';
import { getToken } from '../../../helpers/authUtils';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsPage() {
    const [period, setPeriod] = useState('monthly');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/analytics?period=${period}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) setData(result.data.analytics);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading analytics...</div>;
    if (!data) return <div className="p-10 text-center text-gray-500">Failed to load data</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
                <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
                    {['weekly', 'monthly', 'yearly'].map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${period === p ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-50'}`}> {p} </button>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Revenue Trend */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Revenue Trend</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenueData}>
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
                                <Pie
                                    data={data.bookingStatus}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.bookingStatus.map((entry, index) => (
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
                            <BarChart data={data.userGrowth}>
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
                        {data.topVendors.length === 0 ? <p className="text-sm text-gray-400 italic">No data available</p> :
                            data.topVendors.map((vendor, i) => (
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
        </div>
    );
}
