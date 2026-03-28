"use client";
import { useEffect, useState } from 'react';
import { getToken } from '@/helpers/authUtils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, Briefcase, AlertTriangle, PackageSearch, FolderTree, IndianRupee,
  TrendingUp, ExternalLink, Calendar, CheckCircle2, XCircle, ArrowRight, Server, Activity,
  Cpu, Database, Network, ShieldAlert, Navigation, Terminal, MessageSquare, Map, Flame, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import PackageCard from '@/components/admin/PackageCard';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    users: 0, totalVendors: 0, pendingVendors: 0, packages: 0, categories: 0, revenue: 0,
    recentBookings: [], recentVendors: [], systemActivity: [], activeDisputes: [], topTerritories: [], departures: [], systemHealth: {}
  });
  const [latestPackages, setLatestPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      className="p-8 max-w-[1600px] mx-auto space-y-8 bg-[#0a0a0c] min-h-screen text-slate-300"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Server className="w-8 h-8 text-indigo-400 opacity-80" /> Dashboard
          </h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span> System Status: Online & Secured <span className="opacity-50">|</span> <span className="text-indigo-400">{currentTime.toLocaleTimeString()}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/audit-logs" className="px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-lg transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] text-xs font-mono tracking-widest uppercase flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Security Reports
          </Link>
          <Link href="/admin/vendors" className="px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] text-xs font-mono tracking-widest uppercase flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Vendor Directory
          </Link>
        </div>
      </div>

      {/* Quick Actions Terminal - Above the fold */}
      <div className="flex flex-wrap gap-4 items-center bg-[#111116] p-4 rounded-xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="text-xs font-mono text-slate-500 tracking-widest uppercase flex items-center gap-2 mr-4">
          <Terminal className="w-4 h-4 text-emerald-400" /> Quick Actions:
        </div>
        <button onClick={() => alert("Vendor Mass Mailing feature will be rolling out in v2.1")} className="text-[10px] font-mono tracking-widest uppercase px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded hover:bg-indigo-500/20 transition-all flex items-center gap-2 border-l-2 border-l-indigo-500">
          <MessageSquare className="w-3 h-3" /> Message All Vendors
        </button>
        <button onClick={() => alert("System Health Monitoring Interface under construction. ETA: Next Release.")} className="text-[10px] font-mono tracking-widest uppercase px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded hover:bg-emerald-500/20 transition-all flex items-center gap-2 border-l-2 border-l-emerald-500">
          <Activity className="w-3 h-3" /> Check System Health
        </button>
        <Link href="/admin/payments" className="text-[10px] font-mono tracking-widest uppercase px-4 py-2 bg-pink-500/10 border border-pink-500/30 text-pink-400 rounded hover:bg-pink-500/20 transition-all flex items-center gap-2 border-l-2 border-l-pink-500">
          <TrendingUp className="w-3 h-3" /> Generate Revenue Report
        </Link>
        <button onClick={() => alert("✅ Master Application Cache Cleared successfully from CDN edge routing.")} className="text-[10px] font-mono tracking-widest uppercase px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded hover:bg-amber-500/20 transition-all flex items-center gap-2 border-l-2 border-l-amber-500">
          <Zap className="w-3 h-3" /> Clear Application Cache
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-36 bg-white/5 rounded-2xl border border-white/10"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Travellers" value={stats.users || 0} colorClass="text-blue-400" bgClass="bg-blue-500/10" borderClass="border-blue-500/20" glowClass="shadow-[0_0_20px_rgba(59,130,246,0.1)]" Icon={Users} href="/admin/travellers" delay={0.1} />
          <StatCard title="Verified Vendors" value={stats.totalVendors || 0} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/20" glowClass="shadow-[0_0_20px_rgba(16,185,129,0.1)]" Icon={Briefcase} href="/admin/vendors" delay={0.2} />
          <StatCard title="Pending Approvals" value={stats.pendingVendors || 0} colorClass="text-rose-400" bgClass="bg-rose-500/10" borderClass="border-rose-500/20" glowClass="shadow-[0_0_20px_rgba(244,63,94,0.15)] hover:border-rose-500/40" Icon={AlertTriangle} href="/admin/vendors" delay={0.3} pulse={stats.pendingVendors > 0} />
          <StatCard title="Active Packages" value={stats.packages || 0} colorClass="text-pink-400" bgClass="bg-pink-500/10" borderClass="border-pink-500/20" glowClass="shadow-[0_0_20px_rgba(236,72,153,0.1)]" Icon={PackageSearch} href="/admin/packages" delay={0.4} />
          <StatCard title="Service Categories" value={stats.categories || 0} colorClass="text-slate-300" bgClass="bg-white/5" borderClass="border-white/10" glowClass="shadow-[0_0_20px_rgba(255,255,255,0.05)]" Icon={FolderTree} href="/admin/categories" delay={0.5} />
          <StatCard title="Total Revenue" value={`₹${(Number(stats.revenue) || 0).toLocaleString('en-IN')}`} colorClass="text-emerald-400" bgClass="bg-emerald-500/10" borderClass="border-emerald-500/20" glowClass="shadow-[0_0_20px_rgba(16,185,129,0.1)]" Icon={IndianRupee} href="/admin/payments" delay={0.6} />
        </div>
      )}

      {/* NEW ADDITIONS: Infrastructure, Maps, Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">

        {/* System Health / Vitals */}
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="bg-[#111116] border border-white/10 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col">
          <h2 className="text-sm font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-2 mb-6">
            <Cpu className="w-4 h-4" /> System Resources
          </h2>
          <div className="flex-1 space-y-6 flex flex-col justify-center">
            <div onClick={() => router.push('/admin/system-health')} className="relative group cursor-pointer">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 flex items-center gap-1.5"><Database className="w-3 h-3 text-indigo-400" /> Database Usage</span>
                <span className="text-xs font-mono font-bold text-indigo-400">{stats.systemHealth?.dbLoad || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)] group-hover:bg-indigo-400 transition-colors" style={{ width: `${stats.systemHealth?.dbLoad || 24}%` }}></div>
              </div>
            </div>

            <div onClick={() => router.push('/admin/system-health')} className="relative group cursor-pointer">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 flex items-center gap-1.5"><Network className="w-3 h-3 text-emerald-400" /> Server Latency</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{stats.systemHealth?.latency || 0}ms</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)] group-hover:bg-emerald-400 transition-colors" style={{ width: '15%' }}></div>
              </div>
            </div>

            <div onClick={() => router.push('/admin/audit-logs')} className="relative group cursor-pointer">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400 flex items-center gap-1.5"><Server className="w-3 h-3 text-rose-400" /> Disk Storage</span>
                <span className="text-xs font-mono font-bold text-rose-400 animate-pulse">{stats.systemHealth?.storageLoad || 0}%</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,1)] animate-pulse group-hover:bg-rose-400 transition-colors" style={{ width: `${stats.systemHealth?.storageLoad || 0}%` }}></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Territories / Heatmap Mock */}
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-[#111116] border border-white/10 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col">
          <h2 className="text-sm font-mono tracking-widest text-orange-400 uppercase flex items-center gap-2 mb-6">
            <Flame className="w-4 h-4" /> Top Destinations
          </h2>
          <div className="space-y-4 flex-1">
            {stats.topTerritories?.map((t, idx) => (
              <div onClick={() => router.push('/admin/categories')} key={idx} className="flex items-center gap-4 hover:bg-white/5 p-1 rounded transition-colors cursor-pointer group">
                <div className="w-20 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-300 truncate">{t.name}</div>
                <div className="flex-1 h-2.5 bg-white/5 border border-white/10 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${t.load}%` }}
                    transition={{ duration: 1, delay: 0.2 + idx * 0.1 }}
                    className={`h-full ${t.color} opacity-80 group-hover:opacity-100 shadow-[0_0_10px_currentColor]`}
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-500 w-8 group-hover:text-white transition-colors">{t.load}%</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live System Activity Feed */}
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-[#111116] border border-white/10 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-sm font-mono tracking-widest text-indigo-400 uppercase flex items-center gap-2">
              <Activity className="w-4 h-4" /> System Logs
            </h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 shadow-[0_0_10px_#6366f1]"></span>
            </span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 font-mono">
            {(stats.systemActivity || []).map((log, i) => (
              <div onClick={() => router.push('/admin/audit-logs')} key={i} className="flex items-start gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0 group cursor-pointer hover:bg-white/5 p-1 rounded transition-colors -mx-1">
                <div className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap group-hover:text-slate-400">{log.time}</div>
                <div className={`px-1.5 py-0.5 rounded text-[8px] tracking-widest font-bold uppercase shadow-sm ${log.status === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : log.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                  {log.type}
                </div>
                <div className="text-[10px] text-slate-400 leading-snug flex-1 group-hover:text-slate-200 transition-colors">{log.message}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>


      {/* Analytics Section - Middle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="pt-4"
      >
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 border-t border-white/5 pt-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Activity className="text-indigo-400 w-6 h-6" /> Analytics Overview
          </h2>
          <div className="bg-white/5 p-1 rounded-lg border border-white/10 inline-flex shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            {['weekly', 'monthly', 'yearly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-xs font-mono tracking-widest uppercase transition-all duration-300 rounded ${period === p ? 'bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-indigo-300 hover:bg-white/5 border border-transparent'}`}> {p} </button>
            ))}
          </div>
        </div>

        {analyticsLoading ? (
          <div className="h-64 bg-white/5 rounded-2xl border border-white/10 animate-pulse"></div>
        ) : analyticsData ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Revenue Trend */}
              <div className="bg-[#111116] p-6 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group/chart hover:border-indigo-500/20 transition-colors">
                <h3 className="text-sm font-mono tracking-widest text-indigo-400 uppercase mb-6 flex items-center gap-2"><IndianRupee className="w-4 h-4" /> Revenue Trends</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height={256}>
                    <AreaChart data={analyticsData.revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
                      <XAxis dataKey="_id" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0a0a0c', color: '#cbd5e1' }} itemStyle={{ color: '#818cf8' }} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="revenue" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Booking Status */}
              <div className="bg-[#111116] p-6 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] group/chart hover:border-emerald-500/20 transition-colors">
                <h3 className="text-sm font-mono tracking-widest text-emerald-400 uppercase mb-6 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Booking Status Distribution</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie data={analyticsData.bookingStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {analyticsData.bookingStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0a0a0c', color: '#cbd5e1' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Growth */}
              <div className="bg-[#111116] p-6 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] lg:col-span-2 hover:border-blue-500/20 transition-colors">
                <h3 className="text-sm font-mono tracking-widest text-blue-400 uppercase mb-6 flex items-center gap-2"><Users className="w-4 h-4" /> New User Registrations</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={analyticsData.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff1a" />
                      <XAxis dataKey="_id" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} />
                      <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#0a0a0c', color: '#cbd5e1' }} itemStyle={{ color: '#60a5fa' }} />
                      <Bar dataKey="users" fill="#60a5fa" radius={[4, 4, 0, 0]} name="New Users" barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Vendors */}
              <div className="bg-[#111116] p-6 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col hover:border-orange-500/20 transition-colors">
                <h3 className="text-sm font-mono tracking-widest text-orange-400 uppercase mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Top Performing Vendors</h3>
                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {analyticsData.topVendors.length === 0 ? <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">No Data Available.</p> :
                    analyticsData.topVendors.map((vendor, i) => (
                      <motion.div onClick={() => router.push('/admin/vendors')} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="flex items-center gap-4 p-3 border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer">
                        <div className="text-xs font-mono font-bold text-slate-500">{(i + 1).toString().padStart(2, '0')}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-200 truncate">{vendor.name}</div>
                          <div className="text-[10px] font-mono tracking-widest uppercase text-slate-500 mt-1">{vendor.bookings} Bookings</div>
                        </div>
                        <div className="text-[11px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">₹{(vendor.revenue / 1000).toFixed(1)}k</div>
                      </motion.div>
                    ))
                  }
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-10 text-center text-xs font-mono tracking-widest uppercase text-slate-500 bg-[#111116] border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">Error loading analytics data</div>
        )}
      </motion.div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">

        {/* Open Disputes & Security anomalies */}
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="bg-[#111116] border border-rose-500/20 p-6 rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.05)] flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all"></div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-sm font-mono tracking-widest text-rose-400 uppercase flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Active Disputes
            </h2>
            <span className="text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 px-2 py-0.5 border border-rose-500/30 rounded animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.3)]">{stats.activeDisputes?.length || 0} OPEN</span>
          </div>
          <div className="space-y-3 flex-1 relative z-10">
            {(!stats.activeDisputes || stats.activeDisputes.length === 0) ? (
              <div className="text-xs font-mono text-slate-500 mt-4">No active disputes.</div>
            ) : stats.activeDisputes.map((dsp, i) => (
              <div onClick={() => router.push('/admin/support')} key={i} className={`p-3 border bg-black/40 hover:bg-black/80 rounded-xl transition-colors cursor-pointer group/item ${dsp.priority === 'Critical' ? 'border-rose-500/30 hover:border-rose-500/60' : 'border-amber-500/20 hover:border-amber-500/40'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-mono tracking-widest transition-colors uppercase ${dsp.priority === 'Critical' ? 'text-rose-400 group-hover/item:text-rose-300' : 'text-amber-400 group-hover/item:text-amber-300'}`}>{dsp.id}</span>
                  <span className={`text-[8px] font-mono tracking-widest uppercase px-1.5 py-0.5 border rounded ${dsp.priority === 'Critical' ? 'border-rose-500 text-rose-500 bg-rose-500/10' : 'border-amber-500 text-amber-500 bg-amber-500/10'}`}>{dsp.priority}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 font-bold mb-1 truncate">{dsp.issue}</div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-[9px] font-mono uppercase text-slate-500">Customer: {dsp.user}</span>
                  <span className="text-[9px] font-mono uppercase text-indigo-400 hover:text-indigo-300 underline decoration-indigo-400/30 flex items-center gap-1">View Details <ArrowRight className="w-2.5 h-2.5" /></span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Departures - Active Missions */}
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-[#111116] border border-white/10 hover:border-blue-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-mono tracking-widest text-blue-400 uppercase flex items-center gap-2">
              <Navigation className="w-4 h-4" /> Upcoming Bookings
            </h2>
          </div>
          <div className="space-y-4 flex-1">
            {(!stats.departures || stats.departures.length === 0) ? (
              <div className="text-xs font-mono text-slate-500 mt-4">No upcoming bookings.</div>
            ) : stats.departures.map((dep, i) => (
              <div onClick={() => router.push('/admin/bookings')} key={i} className="flex items-center gap-4 relative group cursor-pointer">
                <div className="absolute left-1.5 top-0 bottom-0 w-[1px] bg-white/10 group-hover:bg-blue-500/30 transition-colors"></div>
                <div className={`relative z-10 w-3 h-3 rounded-full border border-[#111116] ${dep.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}></div>
                <div className={`flex-1 bg-white/5 border border-white/5 rounded-lg p-3 group-hover:bg-white/10 transition-colors ${dep.status === 'Active' ? 'group-hover:border-emerald-500/30' : 'group-hover:border-amber-500/30'}`}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">{dep.user}</span>
                    <span className={`text-[9px] font-mono tracking-widest uppercase ${dep.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'}`}>{dep.time}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate group-hover:text-slate-400">{dep.destination}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Bookings (Moved & Compressed here) */}
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-[#111116] border border-white/10 hover:border-emerald-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-mono tracking-widest text-emerald-400 uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Recent Bookings
            </h2>
            <Link href="/admin/bookings" className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">View All &rarr;</Link>
          </div>
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-white/5">
                {(stats.recentBookings || []).slice(0, 4).map((b, i) => (
                  <tr onClick={() => router.push('/admin/bookings')} key={b?._id || i} className="group hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="py-3 px-2 border-r border-white/5">
                      <div className="text-[11px] font-bold text-slate-300 truncate max-w-[100px]">{b?.user?.name || 'Anonymous'}</div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-[120px] group-hover:text-slate-400">{b?.package?.title || 'Package Node'}</div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase border ${b?.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {b?.status || 'pend'}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!stats.recentBookings || stats.recentBookings.length === 0) && (
                  <tr><td colSpan="3" className="py-8 text-center text-xs font-mono tracking-widest uppercase text-slate-500">No Data Available</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Latest Packages Widget */}
      <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="pt-8 border-t border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-mono tracking-widest text-pink-400 uppercase flex items-center gap-2">
            <PackageSearch className="w-4 h-4" /> Recently Added Packages
          </h2>
          <Link href="/admin/packages" className="text-xs font-mono text-pink-400 hover:text-pink-300 transition-colors uppercase tracking-widest bg-pink-500/10 hover:bg-pink-500/20 px-3 py-1.5 rounded-md border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.1)]">View All Packages &rarr;</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-white/5 border border-white/10 rounded-2xl animate-pulse delay-75"></div>)
          ) : latestPackages.map((pkg, idx) => (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: idx * 0.1 }} key={pkg._id} className="h-full">
              <PackageCard pkg={pkg} showVendorInfo={true} inspectHref={`/admin/packages/item/${pkg._id}`} />
            </motion.div>
          ))}
          {!loading && latestPackages.length === 0 && <div className="col-span-full py-16 text-center text-xs font-mono tracking-widest uppercase text-slate-500 bg-[#111116] rounded-2xl border border-white/5 border-dashed">No packages added yet.</div>}
        </div>
      </motion.div>

      <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
    </motion.div>
  );
}

function StatCard({ title, value, colorClass, bgClass, borderClass, glowClass, Icon, href, delay = 0, pulse = false }) {
  const CardContent = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`p-5 bg-[#111116] border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden group h-full transition-all hover:border-white/20 hover:-translate-y-1 ${glowClass}`}
    >
      <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity ${bgClass.replace('/10', '')}`}></div>
      <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transform group-hover:scale-110 transition-all duration-500">
        <Icon className={`w-16 h-16 ${colorClass}`} />
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className={`w-10 h-10 ${bgClass} border ${borderClass} rounded-xl flex items-center justify-center backdrop-blur-md`}>
            <Icon className={`w-5 h-5 ${colorClass}`} />
          </div>
          {pulse && <span className="flex h-2.5 w-2.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${bgClass.replace('/10', '')} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${bgClass.replace('/10', '')}`}></span>
          </span>}
        </div>
        <h3 className="text-3xl font-mono tracking-tight text-white mb-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{value}</h3>
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-auto group-hover:text-slate-400 transition-colors">{title}</p>
      </div>
    </motion.div>
  );

  return href ? <Link href={href} className="block h-full">{CardContent}</Link> : CardContent;
}
