'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Power, ExternalLink, MapPin } from 'lucide-react';
import api from '@/core/Api/index.js';
import { useToast } from '@/components/ui/ToastContext.js';
import { getServiceName, getPrice } from '@/app/components/admin/PackageCard.js';
import CyberTable from '@/app/components/admin/CyberTable.js';
import { CATEGORY_MAP } from '@/core/Constants/categories.js';

export default function InventoryPage() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [apiCategories, setApiCategories] = useState([]);
    const toast = useToast();

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
            // failed to load categories
        }
    };

    const fetchPackages = async () => {
        try {
            const data = await api.admin.packages.getAll();
            if (data.success) {
                setPackages(data.data.packages);
            }
        } catch (error) {
            // failed to fetch packages
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (pkg, statusToSet) => {
        try {
            const data = await api.admin.packages.updateStatus(pkg._id, {
                vendorId: pkg.vendorId,
                serviceType: pkg.serviceType,
                status: statusToSet
            });
            if (data.success) {
                setPackages(prev => prev.map(p =>
                    (p._id === pkg._id && p.serviceType === pkg.serviceType)
                        ? { ...p, isActive: statusToSet }
                        : p
                ));
                toast(`Package status updated to ${statusToSet ? 'Active' : 'Offline'}`, "success");
            }
        } catch (error) {
            toast("Failed to update status", "error");
        }
    };

    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = (pkg.trekkingName || pkg.roomType || pkg.stretchName || pkg.jumpName || pkg.model || pkg.tourName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pkg.vendor?.businessName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || pkg.serviceType === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const columns = [
        {
            header: 'Image',
            accessor: 'image',
            getValue: (pkg) => pkg.photos?.[0]?.url || 'No Image',
            render: (pkg) => (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#111116] border border-white/10 flex items-center justify-center">
                    {pkg.photos?.[0]?.url ? (
                        <img src={pkg.photos[0].url} alt={getServiceName(pkg)} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                    ) : (
                        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest text-center leading-tight">No<br />Img</span>
                    )}
                </div>
            )
        },
        { header: 'Package Name', accessor: 'name', getValue: (pkg) => getServiceName(pkg), render: (pkg) => <span className="font-bold text-white">{getServiceName(pkg)}</span> },
        { header: 'Type', accessor: 'serviceType', getValue: (pkg) => pkg.serviceType?.replace(/-/g, ' ') || 'Unknown', render: (pkg) => <span className="text-xs uppercase tracking-widest text-indigo-400">{pkg.serviceType?.replace(/-/g, ' ') || 'Unknown'}</span> },
        { header: 'Vendor', accessor: 'vendor', getValue: (pkg) => pkg.vendor?.businessName || 'Unknown Vendor', render: (pkg) => pkg.vendor?.businessName || 'Unknown Vendor' },
        {
            header: 'Location',
            accessor: 'location',
            exportOnly: true,
            getValue: (pkg) => typeof pkg.location === 'object' ? pkg.location?.address : (pkg.location || 'Location Not Defined'),
            render: () => null
        },
        { header: 'Price', accessor: 'price', getValue: (pkg) => Number(getPrice(pkg)), render: (pkg) => <span className="font-mono text-indigo-400">₹{Number(getPrice(pkg)).toLocaleString()}</span> },
        {
            header: 'Status',
            accessor: 'isActive',
            getValue: (pkg) => pkg.isActive ? 'Active' : 'Offline',
            render: (pkg) => (
                <span className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest ${pkg.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {pkg.isActive ? 'Active' : 'Offline'}
                </span>
            )
        },
        {
            header: 'Actions',
            getValue: () => '',
            render: (pkg) => {
                const locationStr = typeof pkg.location === 'object' ? pkg.location?.address : (pkg.location || 'Location Not Defined');
                return (
                    <div className="flex gap-2 items-center">
                        <div
                            className="w-8 h-8 flex items-center justify-center bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded transition-all cursor-help"
                            title={locationStr}
                        >
                            <MapPin size={14} strokeWidth={2.5} />
                        </div>
                        <button
                            onClick={() => toggleStatus(pkg, !pkg.isActive)}
                            className={`w-8 h-8 flex items-center justify-center rounded transition-all ${pkg.isActive ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}
                            title={pkg.isActive ? 'Set Component Offline' : 'Activate Component'}
                        >
                            <Power size={14} strokeWidth={2.5} />
                        </button>
                        <Link
                            href={`/admin/packages/item/${pkg._id}`}
                            className="w-8 h-8 flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded transition-all"
                            title="Inspect Node"
                        >
                            <ExternalLink size={14} strokeWidth={2.5} />
                        </Link>
                    </div>
                );
            }
        }
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-300 pb-24 font-sans">
            <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/5 py-6 px-8 transition-all">
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5"><span className="text-cyan-500/80">Admin Workspace</span> <span>/</span> <span className="text-slate-400">Inventory Catalog</span></div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">All Packages<span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full text-[10px] font-bold tracking-widest uppercase">{packages.length} Items Total</span></h1>
                    </div>
                </div>
            </header>
            <main className="max-w-[1600px] mx-auto p-8 relative z-10">
                <CyberTable data={filteredPackages} columns={columns} loading={loading} loadingText="Fetching Packages..." emptyText="No packages found matching criteria." searchable={true} />
            </main>
        </div>
    );
}
