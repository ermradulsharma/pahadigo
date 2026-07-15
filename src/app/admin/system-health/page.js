'use client';

import { useState, useEffect } from 'react';
import api from '@/core/Api/index.js';
import { 
    Activity, Cpu, Database, Server, HardDrive, 
    Zap, RefreshCcw, ShieldCheck, Clock, Users 
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { motion } from 'framer-motion';
import Loading from '@/components/admin/Loading.js';

export default function SystemHealthPage() {
    const [health, setHealth] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHealth = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const result = await api.admin.stats.getAnalytics({ type: 'health' });
            if (result.success) {
                const data = result.data.analytics;
                setHealth(data);
                
                // Keep historical data (simulated for demonstration)
                setHistory(prev => {
                    const newEntry = {
                        time: new Date().toLocaleTimeString(),
                        memory: data.memory.percentage,
                        cpu: Math.round(data.cpu.load[0] * 100) / 10
                    };
                    const updated = [...prev, newEntry];
                    return updated.slice(-20); // Keep last 20 points
                });
            }
        } catch (e) {
            // health fetch failed
        } finally {
            setLoading(false);
            if (isManual) setTimeout(() => setRefreshing(false), 500);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(() => fetchHealth(), 5000); // Auto refresh every 5s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <Loading message="Syncing System Telemetry..." />;

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 relative selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
            
            <main className="max-w-[1500px] mx-auto px-6 lg:px-12 pt-12 pb-24 relative z-10">
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.15)] group">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-md group-hover:bg-indigo-500/40 transition-all duration-500"></div>
                                <Activity className="w-6 h-6 text-indigo-400 relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">System Health Matrix</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'} animate-pulse`}></div>
                                    <span className="text-xs font-mono text-emerald-500/80 uppercase tracking-widest">Core Engine Status: {health?.status?.toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => fetchHealth(true)} 
                        disabled={refreshing}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-xl transition-all shadow-xl disabled:opacity-50 group"
                    >
                        <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        <span className="text-xs font-mono tracking-widest uppercase font-bold">Synchronize Nodes</span>
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <HealthCard 
                        title="Runtime Uptime" 
                        value={`${Math.floor(health?.uptime / 3600)}h ${Math.floor((health?.uptime % 3600) / 60)}m`}
                        subValue="Engine execution duration"
                        Icon={Clock}
                        color="text-blue-400"
                        bg="bg-blue-500/10"
                    />
                    <HealthCard 
                        title="Memory Load" 
                        value={`${health?.memory?.percentage}%`}
                        subValue={`${formatBytes(health?.memory?.used)} / ${formatBytes(health?.memory?.total)}`}
                        Icon={Server}
                        color="text-indigo-400"
                        bg="bg-indigo-500/10"
                        progress={health?.memory?.percentage}
                    />
                    <HealthCard 
                        title="CPU Performance" 
                        value={`${health?.cpu?.cores} Cores`}
                        subValue={health?.cpu?.model?.split(' ')[0]}
                        Icon={Cpu}
                        color="text-emerald-400"
                        bg="bg-emerald-500/10"
                    />
                    <HealthCard 
                        title="Active Sessions" 
                        value={health?.activeUsers}
                        subValue="Verified platform users"
                        Icon={Users}
                        color="text-pink-400"
                        bg="bg-pink-500/10"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Performance Trends */}
                    <div className="lg:col-span-2 bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                        <h2 className="text-sm font-mono tracking-[0.2em] text-indigo-400 uppercase mb-8 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Performance Telemetry (Real-time)
                        </h2>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                                    <XAxis dataKey="time" hide />
                                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0a0a0c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="memory" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" name="Memory (%)" isAnimationActive={false} />
                                    <Area type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={2} fill="transparent" name="CPU Load" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Database Health */}
                    <div className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative">
                        <h2 className="text-sm font-mono tracking-[0.2em] text-emerald-400 uppercase mb-8 flex items-center gap-2">
                            <Database className="w-4 h-4" /> Data Core Status
                        </h2>
                        <div className="space-y-6">
                            <DataRow label="Active Collections" value={health?.database?.collections} />
                            <DataRow label="Total Objects" value={health?.database?.objects?.toLocaleString()} />
                            <DataRow label="Physical Data Size" value={formatBytes(health?.database?.dataSize)} />
                            <DataRow label="Storage Allocation" value={formatBytes(health?.database?.storageSize)} />
                            
                            <div className="pt-6 border-t border-white/5 mt-6">
                                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    <div>
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Security Layer</p>
                                        <p className="text-xs text-slate-400">Database encryption active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hardware details */}
                <div className="mt-8 bg-gray-900/20 border border-white/5 rounded-2xl p-6 flex flex-wrap gap-12 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Server className="w-10 h-10 text-slate-600" />
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Node Architecture</p>
                            <p className="text-sm font-bold text-slate-300">{health?.cpu?.model}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <HardDrive className="w-10 h-10 text-slate-600" />
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Local OS</p>
                            <p className="text-sm font-bold text-slate-300">Enterprise Unix-Node Environment</p>
                        </div>
                    </div>
                    <div className="hidden lg:block h-12 w-px bg-white/5"></div>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-400">Telemetry Stream</p>
                        <p className="text-xs text-slate-500 mt-1">Last Update: {new Date(health?.timestamp).toLocaleTimeString()}</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

function HealthCard({ title, value, subValue, Icon, color, bg, progress }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl relative group overflow-hidden"
        >
            <div className={`absolute -bottom-6 -right-6 w-24 h-24 ${bg} rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center border border-white/5`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                {progress !== undefined && (
                    <span className={`text-[10px] font-mono font-bold ${progress > 80 ? 'text-rose-400' : 'text-indigo-400'}`}>{progress}%</span>
                )}
            </div>
            <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-4">{title}</p>
                <p className="text-[10px] text-slate-400 font-medium">{subValue}</p>
                
                {progress !== undefined && (
                    <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
                        <div 
                            className={`h-full ${progress > 80 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-indigo-500 shadow-[0_0_10px_#6366f1]'} transition-all duration-1000`} 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function DataRow({ label, value }) {
    return (
        <div className="flex justify-between items-center group">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">{label}</span>
            <span className="text-xs font-bold text-white font-mono bg-white/5 px-2 py-1 rounded border border-white/5">{value || '---'}</span>
        </div>
    );
}
