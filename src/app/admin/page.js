"use client";
import { useEffect, useState } from 'react';
import { getToken } from '@/helpers/authUtils';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Users, Briefcase, AlertTriangle, PackageSearch, FolderTree, IndianRupee,
    TrendingUp, ExternalLink, Calendar, CheckCircle2, XCircle, ArrowRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, totalVendors: 0, pendingVendors: 0, packages: 0, categories: 0, revenue: 0, recentBookings: [], recentVendors: [] });
    const [latestPackages, setLatestPackages] = useState([]);
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

                // Fetch Latest Packages
                const pkgRes = await fetch('/api/admin/packages', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const pkgData = await pkgRes.json();
                if (pkgData.success) {
                    setLatestPackages(pkgData.data.packages.slice(0, 4));
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
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50 min-h-screen"
        >
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin Overview</h1>
                    <p className="text-slate-500 font-medium">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/vendors" className="px-5 py-2.5 bg-indigo-600/10 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition-all font-bold flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Review Vendors
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-36 bg-slate-200 rounded-2xl"></div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    <StatCard title="Travellers" value={stats.users || 0} gradient="from-indigo-500 to-blue-600" Icon={Users} href="/admin/travellers" delay={0.1} />
                    <StatCard title="Vendors" value={stats.totalVendors || 0} gradient="from-teal-400 to-emerald-600" Icon={Briefcase} href="/admin/vendors" delay={0.2} />
                    <StatCard title="Pending Auth" value={stats.pendingVendors || 0} gradient="from-orange-400 to-red-500" Icon={AlertTriangle} href="/admin/vendors" delay={0.3} pulse={stats.pendingVendors > 0} />
                    <StatCard title="Packages" value={stats.packages || 0} gradient="from-pink-500 to-rose-600" Icon={PackageSearch} href="/admin/packages" delay={0.4} />
                    <StatCard title="Categories" value={stats.categories || 0} gradient="from-slate-600 to-slate-800" Icon={FolderTree} href="/admin/categories" delay={0.5} />
                    <StatCard title="Revenue" value={`₹${(Number(stats.revenue) || 0).toLocaleString('en-IN')}`} gradient="from-green-500 to-emerald-700" Icon={IndianRupee} href="/admin/payments" delay={0.6} />
                </div>
            )}

            {/* Analytics Section */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="pt-4"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-indigo-600 w-6 h-6" /> Growth Analytics
                    </h2>
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200/60 inline-flex">
                        {['weekly', 'monthly', 'yearly'].map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-5 py-2 text-sm font-bold rounded-lg capitalize transition-all duration-300 ${period === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}> {p} </button>
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
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Growth */}
                    <div className="bg-white/80 backdrop-blur border border-white p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">User Acquisition</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={analyticsData.userGrowth}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="users" fill="#10b981" radius={[6, 6, 0, 0]} name="New Users" barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Vendors */}
                    <div className="bg-white/80 backdrop-blur border border-white p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Top Generators</h3>
                        <div className="space-y-4">
                            {analyticsData.topVendors.length === 0 ? <p className="text-sm text-slate-400 italic font-medium">No sales data yet.</p> :
                                analyticsData.topVendors.map((vendor, i) => (
                                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl px-2 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-sm font-black text-indigo-600">#{i + 1}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-800 truncate">{vendor.name}</div>
                                            <div className="text-[11px] font-bold text-slate-400 mt-0.5">{vendor.bookings} Bookings</div>
                                        </div>
                                        <div className="text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">₹{(vendor.revenue/1000).toFixed(1)}k</div>
                                    </motion.div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="p-10 text-center text-slate-500 font-medium bg-white rounded-2xl border border-dashed border-slate-200">Failed to load analytics data</div>
        )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Recent Bookings */}
            <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="bg-white border border-slate-100 p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-indigo-500" /> Recent Bookings
                    </h2>
                    <Link href="/admin/bookings" className="text-sm text-indigo-600 hover:text-indigo-800 font-bold transition-colors">View All &rarr;</Link>
                </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-400 font-medium border-b border-gray-50">
                                <tr>
                                    <th className="pb-3 px-2">Traveller</th>
                                    <th className="pb-4 font-bold uppercase tracking-wider text-[11px] text-slate-400">Package</th>
                                    <th className="pb-4 font-bold uppercase tracking-wider text-[11px] text-slate-400 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(stats.recentBookings || []).map((b, i) => (
                                    <tr key={b?._id || i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 font-bold text-slate-700">{b?.user?.name || 'Anonymous'}</td>
                                        <td className="py-4 text-slate-500 font-medium truncate max-w-[150px]">
                                            <Link href="/admin/bookings" className="group-hover:text-indigo-600 transition-colors">{b?.package?.title || 'Package'}</Link>
                                        </td>
                                        <td className="py-4 text-right">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${b?.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {b?.status === 'confirmed' ? <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5"/> : <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5"/>}
                                                {b?.status || 'pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {(!stats.recentBookings || stats.recentBookings.length === 0) && (
                                    <tr><td colSpan="3" className="py-6 text-center text-slate-400 font-medium">No recent bookings</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Recent Vendors */}
                <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-white border border-slate-100 p-7 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-emerald-500" /> New Vendors
                        </h2>
                        <Link href="/admin/vendors" className="text-sm text-indigo-600 hover:text-indigo-800 font-bold transition-colors">View All &rarr;</Link>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-400 font-medium border-b border-gray-50">
                                <tr>
                                    <th className="pb-4 font-bold uppercase tracking-wider text-[11px] text-slate-400">Buesiness Name</th>
                                    <th className="pb-4 font-bold uppercase tracking-wider text-[11px] text-slate-400">Action</th>
                                    <th className="pb-4 font-bold uppercase tracking-wider text-[11px] text-slate-400 text-right">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(stats.recentVendors || []).map((v, i) => (
                                    <tr key={v?._id || i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4">
                                            <div className="font-bold text-slate-800">{v?.businessName || 'New Business'}</div>
                                            <div className="text-[11px] font-medium text-slate-400">{v?.user?.email || 'N/A'}</div>
                                        </td>
                                        <td className="py-4">
                                            <Link
                                                href={`/admin/vendors/${v?._id || '#'}`}
                                                className="text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors inline-block"
                                            >
                                                Review
                                            </Link>
                                        </td>
                                        <td className="py-4 text-right text-slate-400 font-medium text-xs">
                                            {v?.createdAt ? new Date(v.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                                {(!stats.recentVendors || stats.recentVendors.length === 0) && (
                                    <tr><td colSpan="3" className="py-6 text-center text-slate-400 font-medium">No new vendors</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>

            {/* Latest Packages Widget */}
            <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="pt-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <PackageSearch className="w-6 h-6 text-pink-500" /> Latest Experiences
                    </h2>
                    <Link href="/admin/packages" className="text-sm text-indigo-600 hover:text-indigo-800 font-bold transition-colors">Manage All &rarr;</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {loading ? (
                        [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-slate-200 rounded-3xl animate-pulse delay-75"></div>)
                    ) : latestPackages.map((pkg, idx) => (
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.1 }} key={pkg._id} className="group bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-2xl hover:-translate-y-1 border border-white transition-all duration-500 flex flex-col">
                            <div className="relative h-48 bg-slate-100 overflow-hidden">
                                {pkg.photos?.[0]?.url ? (
                                    <img src={pkg.photos[0].url} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <PackageSearch className="w-12 h-12 stroke-1" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/20 ${pkg.isActive ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                                        {pkg.isActive ? 'LIVE' : 'DRAFT'}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col bg-white">
                                <h3 className="font-bold text-slate-800 text-lg line-clamp-1 mb-1 group-hover:text-indigo-600 transition-colors">{pkg.title || pkg.tourDetails?.tourName || pkg.details?.jumpName || pkg.vehicleDetails?.model || 'Service Listing'}</h3>
                                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-1.5"><Briefcase className="w-3 h-3"/> {pkg.vendor?.businessName || 'Anonymous'}</div>
                                <div className="mt-auto flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Price</p>
                                        <div className="text-xl font-black text-slate-900">₹{(pkg.pricing?.pricePerPerson || pkg.pricing?.pricePerNight || pkg.pricing?.baseFare || 0).toLocaleString()}</div>
                                    </div>
                                    <Link href={`/admin/packages/${pkg.vendorId}`} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-xl transition-all shadow-sm">
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    {!loading && latestPackages.length === 0 && <div className="col-span-full py-16 text-center text-slate-400 font-medium bg-slate-100/50 rounded-3xl border border-dashed border-slate-200">No active experiences available on the platform yet.</div>}
                </div>
            </motion.div>
        </motion.div>
    );
}

function StatCard({ title, value, gradient, Icon, href, delay = 0, pulse = false }) {
    const CardContent = (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={`p-6 bg-gradient-to-br ${gradient} rounded-3xl shadow-xl text-white relative overflow-hidden group h-full transition-transform hover:-translate-y-1`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-20 transform group-hover:scale-125 transition-transform duration-500 ease-out">
                <Icon className="w-24 h-24 -mt-4 -mr-4" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                    {pulse && <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>}
                </div>
                <h3 className="text-4xl font-black tracking-tight mb-1">{value}</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-white/80">{title}</p>
                <div className="mt-auto pt-4 flex items-center text-xs font-bold text-white/90 group-hover:text-white">
                    Manage <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </motion.div>
    );

    return href ? <Link href={href} className="block h-full">{CardContent}</Link> : CardContent;
}
