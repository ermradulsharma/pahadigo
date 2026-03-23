'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import { ArrowLeft, Save, Server, Code, Settings, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AdminPackageItemPage({ params }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;
    const router = useRouter();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [rawJson, setRawJson] = useState("");

    const [formData, setFormData] = useState({
        title: '',
        isActive: false,
    });

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const token = getToken();
                const res = await fetch(`/api/admin/packages/item/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data?.item) {
                        setItem(data.data.item);

                        // Standardize generic fields for simple editing
                        const fetched = data.data.item;
                        const extractedTitle = fetched.title || fetched.tourDetails?.tourName || fetched.details?.jumpName || fetched.vehicleDetails?.model || '';

                        setFormData({
                            title: extractedTitle,
                            isActive: fetched.isActive || false,
                        });

                        // Create a clean JSON for advanced mode
                        const cleanObj = { ...fetched };
                        delete cleanObj.serviceType;
                        delete cleanObj.vendorId;
                        delete cleanObj.vendor;
                        setRawJson(JSON.stringify(cleanObj, null, 2));
                    }
                } else {
                    setError('Failed to locate item in database.');
                }
            } catch (e) {
                setError('Connection error while fetching item.');
            } finally {
                setLoading(false);
            }
        };
        fetchItem();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // We will parse the rawJson and merge our simple form data overrides
            let payload = JSON.parse(rawJson);

            // Inject standard overrides from the basic fields if we know where they go
            if (item.serviceType === 'tourPackages') {
                if (!payload.tourDetails) payload.tourDetails = {};
                payload.tourDetails.tourName = formData.title;
            } else if (item.serviceType === 'taxiPackages') {
                if (!payload.vehicleDetails) payload.vehicleDetails = {};
                payload.vehicleDetails.model = formData.title;
            } else {
                payload.title = formData.title;
            }

            payload.isActive = formData.isActive;

            const token = getToken();
            const res = await fetch(`/api/admin/packages/item/${id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Item core updated successfully.');
                router.refresh();
            } else {
                alert('Failed to update item core.');
            }
        } catch (e) {
            alert('Invalid JSON structure or network error.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="w-16 h-16 border-t-2 border-pink-500 border-r-2 border-r-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(236,72,153,0.5)]"></div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-slate-400 font-mono">
                <AlertTriangle className="mr-3 text-rose-500" /> {error || "Item not found"}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-slate-300 pb-24">
            <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 px-8 py-5">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.back()} className="text-slate-400 hover:text-white transition-colors p-2 bg-white/5 rounded-lg border border-white/10 hover:border-white/20">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-2 mb-1">
                                <Server className="w-3 h-3 text-pink-400" /> Database Identity
                                <span className="text-slate-700">/</span>
                                <span className="text-pink-400">{item._id}</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                {formData.title || 'Unknown Entity'}
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest uppercase border ${formData.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                    {formData.isActive ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 border border-pink-500/30 hover:border-pink-400/50 rounded-lg text-xs font-mono font-bold tracking-widest uppercase flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(236,72,153,0.2)] disabled:opacity-50">
                            {saving ? <div className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                            {saving ? 'Writing...' : 'Commit Node'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-8 pt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Core Basic Configuration */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#111116] border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
                            <h2 className="text-sm font-mono tracking-widest text-pink-400 uppercase flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                                <Settings className="w-4 h-4" /> Component Structure
                            </h2>

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2">Display Designation</label>
                                    <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all font-mono" />
                                </div>

                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-mono font-bold text-slate-300 uppercase tracking-widest mb-1">Network Transmission</label>
                                        <p className="text-xs text-slate-500">Toggle whether this node is accessible to external clients.</p>
                                    </div>
                                    <button onClick={() => setFormData({ ...formData, isActive: !formData.isActive })} className={`relative w-14 h-7 rounded-full transition-all duration-300 ${formData.isActive ? 'bg-emerald-500/30 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-slate-800 border border-slate-700'}`}>
                                        <div className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full transition-all duration-300 ${formData.isActive ? 'left-[calc(100%-1.5rem)] bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'left-1 bg-slate-500'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Advanced Raw JSON Editor */}
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-[#111116] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <div className="bg-black/80 border-b border-white/10 px-8 py-5 flex items-center justify-between">
                                <h2 className="text-sm font-mono tracking-widest text-indigo-400 uppercase flex items-center gap-3">
                                    <Code className="w-4 h-4" /> Raw Data Mutator
                                </h2>
                                <div className="flex gap-2">
                                    <span className="w-3 h-3 rounded-full border border-rose-500 flex items-center justify-center"><div className="w-1 h-1 bg-rose-500 rounded-full animate-ping"></div></span>
                                    <span className="w-3 h-3 rounded-full border border-amber-500 -ml-1"></span>
                                    <span className="w-3 h-3 rounded-full border border-emerald-500 -ml-1"></span>
                                </div>
                            </div>
                            <div className="p-1">
                                <textarea
                                    value={rawJson}
                                    onChange={e => setRawJson(e.target.value)}
                                    className="w-full h-[500px] bg-black text-[#56b6c2] p-6 font-mono text-sm leading-relaxed focus:outline-none resize-none custom-scrollbar"
                                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '100% 28px', lineHeight: '28px' }}
                                    spellCheck="false"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-[#111116] border border-white/10 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                            <h3 className="text-[10px] font-mono tracking-widest text-slate-500 uppercase flex items-center gap-2 border-b border-white/10 pb-4 mb-6">
                                <Activity className="w-3 h-3 text-cyan-400" /> Origin Metrics
                            </h3>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mb-1 block">Entity Type</label>
                                    <div className="text-sm text-cyan-400 font-mono flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_currentColor]"></span> {item.serviceType}
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <label className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mb-1 block">Provider Link</label>
                                    <Link href={`/admin/vendors/${item.vendorId}`} className="text-sm text-indigo-400 font-mono hover:text-indigo-300 hover:underline transition-colors flex items-center gap-2">
                                        {item.vendor?.businessName || item.vendorId}
                                    </Link>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <label className="text-[9px] font-mono tracking-widest text-slate-500 uppercase mb-1 block">Creation Timestamp</label>
                                    <div className="text-xs text-slate-300 font-mono">{new Date(item.createdAt || Date.now()).toLocaleString()}</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                            <div className="flex items-start gap-4">
                                <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30 text-emerald-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold font-mono tracking-widest text-emerald-400 uppercase mb-1">Editor Warning</h3>
                                    <p className="text-[10px] uppercase font-mono tracking-widest text-emerald-200/50 leading-relaxed">
                                        Direct modification of raw JSON payload instantly alters the node properties across the entire neural network. Ensure bracket integrity before committing changes.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.6); }
      `}</style>
        </div>
    );
}
