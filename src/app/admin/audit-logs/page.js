'use client';

import { useState, useEffect, Fragment } from 'react';
import { getToken } from '@/app/utils/authUtils.js';
import api from '@/core/Api/index.js';
import { ChevronDown, ChevronRight, Search, Activity, Database, ShieldAlert, Cpu, Terminal, Filter, LayoutGrid } from 'lucide-react';
import Loading from '@/components/admin/Loading.js';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ action: '', target: '' });
    const [expandedLogId, setExpandedLogId] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, [page, filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                ...Object.fromEntries(Object.entries(filter).filter(([_, v]) => v))
            };
            const data = await api.admin.auditLogs.getAll(params);
            if (data.success) {
                setLogs(data.data.logs || []);
                setTotal(data.data.total || 0);
                setPages(data.data.totalPages || 1);
            }
        } catch (e) {
            // failed to fetch audit logs
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
        setPage(1);
    };

    const toggleExpand = (id) => {
        setExpandedLogId(expandedLogId === id ? null : id);
    };

    const getCyberBadge = (action) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20';
            case 'UPDATE': return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20';
            case 'DELETE': return 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20';
            default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/20';
        }
    };

    const SyntaxHighlight = ({ json }) => {
        if (!json) return null;
        const jsonString = JSON.stringify(json, null, 2);
        // Escape the raw JSON string first to neutralize any HTML within values,
        // then inject safe <span> tags for syntax highlighting.
        const escaped = jsonString
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const highlighted = escaped.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
                let cls = 'text-sky-300'; // string value
                if (/^"|/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'text-emerald-300'; // key
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'text-rose-400'; // boolean
                } else if (/null/.test(match)) {
                    cls = 'text-amber-300'; // null
                } else {
                    cls = 'text-purple-400'; // number
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
        return <pre className="font-mono text-[13px] leading-6 tracking-wide text-gray-300" dangerouslySetInnerHTML={{ __html: highlighted }} />;
    };

    return (
        <div className="min-h-screen bg-[#050505] text-slate-300 relative selection:bg-indigo-500/30 selection:text-indigo-200">
            {/* Ambient Background Grid & Glows */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

            <main className="max-w-[1500px] mx-auto px-6 lg:px-12 pt-12 pb-24 relative z-10">
                {/* SIEM Header */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gray-900 border border-white/10 shadow-[0_0_30px_rgba(99,102,241,0.15)] group">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-md group-hover:bg-indigo-500/40 transition-all duration-500"></div>
                                <ShieldAlert className="w-6 h-6 text-indigo-400 relative z-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Security Telemetry</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                    <span className="text-xs font-mono text-emerald-500/80 uppercase tracking-widest">Active System Monitoring</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Glass Control Panel */}
                    <div className="flex items-center gap-3 bg-gray-900/50 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-4 w-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <select name="action" value={filter.action} onChange={handleFilterChange} className="pl-9 pr-10 py-2.5 bg-gray-950/50 border border-white/5 hover:border-white/10 text-sm font-medium text-gray-300 focus:ring-1 focus:ring-indigo-500/50 rounded-xl transition-all cursor-pointer appearance-none outline-none">
                                <option value="">Filter Operations</option>
                                <option value="CREATE">Insertions (CREATE)</option>
                                <option value="UPDATE">Mutations (UPDATE)</option>
                                <option value="DELETE">Deletions (DELETE)</option>
                            </select>
                        </div>

                        <div className="w-px h-8 bg-white/10"></div>

                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LayoutGrid className="h-4 w-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <select name="target" value={filter.target} onChange={handleFilterChange} className="pl-9 pr-10 py-2.5 bg-gray-950/50 border border-white/5 hover:border-white/10 text-sm font-medium text-gray-300 focus:ring-1 focus:ring-indigo-500/50 rounded-xl transition-all cursor-pointer appearance-none outline-none">
                                <option value="">Target Nodes</option>
                                <option value="VENDOR">Vendors</option>
                                <option value="USER">Users</option>
                                <option value="PACKAGE">Packages</option>
                                <option value="BOOKING">Bookings</option>
                                <option value="DISPUTE">Disputes</option>
                                <option value="SETTING">Settings</option>
                            </select>
                        </div>
                    </div>
                </header>

                {/* Main Data Core */}
                <div className="bg-gray-900/40 backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/40 border-b border-white/5">
                                    <th className="p-5 w-14"></th>
                                    <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Operation Hash</th>
                                    <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Actor Identity</th>
                                    <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Entity Target</th>
                                    <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] text-right">Timestamp (UTC)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="p-24 text-center">
                                            <Loading message="Syncing Audit Streams..." />
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-24 text-center">
                                            <div className="max-w-sm mx-auto flex flex-col items-center">
                                                <div className="w-24 h-24 rounded-full bg-gray-900/80 border border-white/5 flex items-center justify-center mb-6 relative">
                                                    <div className="absolute inset-0 bg-rose-500/10 rounded-full animate-ping opacity-20"></div>
                                                    <Database className="w-10 h-10 text-gray-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-300">Null Output</h3>
                                                <p className="text-sm font-mono text-gray-500 mt-3 leading-relaxed">No telemetry signatures detected for the current query parameters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map(log => {
                                        const actor = log.userId || log.adminId || {};
                                        const isExpanded = expandedLogId === log._id;

                                        return (
                                            <Fragment key={log._id}>
                                                {/* Primary Cyber Row */}
                                                <tr onClick={() => toggleExpand(log._id)} className={`hover:bg-white/[0.02] transition-colors duration-300 cursor-pointer group ${isExpanded ? 'bg-indigo-500/[0.03]' : ''}`}>
                                                    <td className="p-5 text-gray-600 group-hover:text-indigo-400 transition-colors pl-6">
                                                        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-indigo-400' : ''}`} />
                                                    </td>
                                                    <td className="p-5">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-bold ${getCyberBadge(log.action)} tracking-[0.1em]`}>
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-gray-200">{actor.name || actor.email || 'SYSTEM_GUEST'}</span>
                                                            <span className="text-[10px] font-mono text-indigo-400/70 mt-1">{actor.role || 'UNAUTHENTICATED'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex items-center gap-3">
                                                            <Activity className="w-4 h-4 text-gray-600" />
                                                            <div className="flex flex-col">
                                                                <span className="font-mono text-xs font-bold text-gray-300 uppercase tracking-wider">{log.target}</span>
                                                                {log.targetId && (
                                                                    <span className="text-[10px] font-mono text-gray-500 mt-0.5">
                                                                        ID: <span className="text-gray-400">{log.targetId.slice(-6)}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-right flex items-center justify-end h-full">
                                                        <span className="font-mono text-xs text-gray-500 bg-gray-900/80 border border-white/5 py-1 px-3 rounded-md">
                                                            {new Date(log.createdAt).toISOString().replace('T', ' ').substring(0, 19)}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Cyber Details Console */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="5" className="p-0 border-b border-indigo-500/20">
                                                            <div className="bg-[#0a0a0c] border-t border-white/5 p-6 lg:p-10 flex flex-col lg:flex-row gap-8 shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)]">

                                                                {/* Trace Metadata Panel */}
                                                                <div className="w-full lg:w-1/3">
                                                                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                                                        <Terminal className="w-5 h-5 text-indigo-500" />
                                                                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">System Trace Data</h4>
                                                                    </div>

                                                                    <div className="space-y-6">
                                                                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                                                                            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
                                                                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Network Origin</span>
                                                                            <span className="block font-mono text-sm text-sky-300">{log.ipAddress || '127.0.0.1'}</span>
                                                                        </div>

                                                                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                                                                            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                                                                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Execution Pipeline</span>
                                                                            <span className="block font-mono text-sm text-emerald-300 break-all">{log.details?.route || 'INTERNAL_PROC'}</span>
                                                                        </div>

                                                                        <div className="bg-gray-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-amber-500/30 transition-colors">
                                                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Resolution Status</span>
                                                                            <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded bg-black/50 border ${log.details?.status >= 400 ? 'text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'}`}>
                                                                                HTTP_{log.details?.status || 200}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Decrypted Payload Terminal */}
                                                                <div className="w-full lg:w-2/3 flex flex-col">
                                                                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                                                                        <Search className="w-5 h-5 text-emerald-500" />
                                                                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">Decrypted Payload Matrix</h4>
                                                                    </div>

                                                                    <div className="flex-1 bg-[#0d1117] rounded-xl border border-white/10 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col relative group">
                                                                        {/* Terminal Header */}
                                                                        <div className="flex items-center px-4 py-2 border-b border-white/5 bg-gray-950/80 shrink-0">
                                                                            <div className="flex gap-1.5">
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                                                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                                                                            </div>
                                                                            <span className="ml-4 font-mono text-[10px] text-gray-500">payload_dump.json</span>
                                                                        </div>

                                                                        {/* Terminal Body with glowing Syntax */}
                                                                        <div className="p-6 overflow-x-auto h-full min-h-[250px] relative">
                                                                            <div className="absolute top-0 right-0 w-full h-full bg-indigo-500/5 pointer-events-none group-hover:bg-transparent transition-colors"></div>
                                                                            <SyntaxHighlight json={log.details?.payload || log.details || { _status: "No active payload detected" }} />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Cyber Pagination */}
                    {!loading && logs.length > 0 && (
                        <div className="p-6 border-t border-white/5 bg-gray-900/60 backdrop-blur-md flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
                                Processing <span className="text-indigo-400 px-1 font-bold">Block {page}</span> / <span className="text-gray-400">{pages}</span>
                                <span className="mx-3 border-l border-white/10"></span>
                                Total Signatures: <span className="text-white font-bold ml-1">{total}</span>
                            </div>
                            <div className="flex gap-2">
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-5 py-2 rounded bg-gray-800 border border-white/5 text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-gray-700 hover:border-white/20 disabled:opacity-30 disabled:hover:bg-gray-800 disabled:hover:border-white/5 transition-all w-28 text-center"> &lt; Prev</button>
                                <button disabled={page === pages || pages === 0} onClick={() => setPage(p => p + 1)} className="px-5 py-2 rounded bg-gray-800 border border-white/5 text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-gray-700 hover:border-indigo-500/30 disabled:opacity-30 disabled:hover:bg-gray-800 disabled:hover:border-white/5 transition-all w-28 text-center">Next &gt;</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
