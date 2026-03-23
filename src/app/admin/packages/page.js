'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/helpers/authUtils';
import PackageCard, { getServiceName, getPrice } from '@/components/admin/PackageCard';
import { CATEGORY_MAP } from '@/core/Constants/categories';

export default function InventoryPage() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [apiCategories, setApiCategories] = useState([]);

    useEffect(() => {
        fetchPackages();
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success && data.data?.categories) {
                setApiCategories(data.data.categories);
            }
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const fetchPackages = async () => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/packages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPackages(data.data.packages);
            }
        } catch (error) {
            console.error("Failed to fetch packages:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (pkg, statusToSet) => {
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/packages/${pkg._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vendorId: pkg.vendorId,
                    serviceType: pkg.serviceType,
                    status: statusToSet
                })
            });
            const data = await res.json();
            if (data.success) {
                setPackages(prev => prev.map(p =>
                    (p._id === pkg._id && p.serviceType === pkg.serviceType)
                        ? { ...p, isActive: statusToSet }
                        : p
                ));
            }
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = (pkg.trekkingName || pkg.roomType || pkg.stretchName || pkg.jumpName || pkg.model || pkg.tourName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pkg.vendor?.businessName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || pkg.serviceType === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-300 pb-24 font-sans">
            <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/5 py-6 px-8 transition-all">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                            <span className="text-cyan-500/80">Admin Workspace</span>
                            <span>/</span>
                            <span className="text-slate-400">Inventory Catalog</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            All Packages
                            <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-[10px] font-bold tracking-widest uppercase">
                                {packages.length} Items Total
                            </span>
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto px-8 py-10 relative z-10">
                {/* Search & Filter Bar */}
                <div className="bg-[#111116] border border-white/10 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
                    <div className="absolute top-0 right-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="relative flex-1 w-full md:w-auto relative z-10 group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input type="text" placeholder="Search packages by name, location, or vendor..." className="w-full pl-12 pr-4 py-3.5 bg-black/40 border border-white/5 rounded-xl focus:border-cyan-500/50 focus:bg-black/60 outline-none transition-all text-sm text-cyan-50 placeholder-slate-500 shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="relative w-full md:w-auto min-w-[200px] z-10">
                        <select className="w-full px-5 py-3.5 bg-black/40 border border-white/5 rounded-xl text-sm font-bold text-slate-300 hover:text-white outline-none focus:border-indigo-500/50 focus:bg-black/60 appearance-none cursor-pointer transition-all shadow-inner" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                            <option value="all">Global Matrix</option>
                            {apiCategories.map((cat) => (
                                <option key={cat._id} value={CATEGORY_MAP[cat.slug] || cat.slug}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div>
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="bg-[#111116] h-[380px] rounded-3xl border border-white/5 animate-pulse overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredPackages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPackages.map((pkg) => (
                                <PackageCard key={`${pkg._id}-${pkg.serviceType}`} pkg={pkg} showVendorInfo={true} inspectHref={`/admin/packages/item/${pkg._id}`} onToggleStatus={(p, status) => toggleStatus(p, status)} />
                            ))}
                        </div>
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-slate-500 bg-[#111116]/50 rounded-3xl border border-white/5 relative overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:30px_30px] bg-fixed opacity-[0.03] pointer-events-none"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="p-5 bg-white/5 rounded-2xl mb-5 text-indigo-400 border border-white/5 shadow-lg shadow-black">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Packages Found</h3>
                                <p className="text-sm text-slate-500 max-w-sm text-center">We couldn't find any items matching your current search constraints or category filters.</p>
                                <button onClick={() => { setSearchTerm(''); setFilterCategory('all'); }} className="mt-6 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold border border-white/10 transition-colors">Clear Filters</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
