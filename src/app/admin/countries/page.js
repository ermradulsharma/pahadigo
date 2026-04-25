"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

import CyberTable from '@/components/admin/CyberTable';
import { Search, Globe2, MapPin } from 'lucide-react';
import Loading from '@/components/admin/Loading';

export default function CountriesPage() {
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 100, totalPages: 1, total: 0 }); // Increased limit for vector scanning

    useEffect(() => {
        fetchCountries(pagination.page);
    }, [pagination.page]); // Depend on page number

    const fetchCountries = async (page) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/countries?page=${page}&limit=${pagination.limit}`);
            const data = await res.json();
            if (data.success) {
                setCountries(data.data.countries || []);
                if (data.data.pagination) {
                    setPagination(prev => ({ ...prev, ...data.data.pagination }));
                }
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: 'S.No',
            className: 'w-[5%]',
            tdClassName: 'text-slate-500 font-mono text-[11px] text-center',
            render: (_, index) => (pagination.page - 1) * pagination.limit + index + 1
        },
        {
            header: 'Nation Name',
            accessor: 'name',
            render: (c) => (
                <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-indigo-400" /> {c.name}
                </div>
            )
        },
        {
            header: 'ISO Code',
            accessor: 'isoCode',
            tdClassName: 'text-sm text-indigo-400 font-mono font-bold',
            render: (c) => c.isoCode || '-'
        },
        {
            header: 'Phone Code',
            accessor: 'phoneCode',
            render: (c) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {c.phoneCode ? `+${c.phoneCode}` : '-'}
                </span>
            )
        },
        {
            header: 'Currency',
            accessor: 'currency',
            tdClassName: 'text-sm text-slate-400 font-mono font-bold',
            render: (c) => c.currency || '-'
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (c) => (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {c.status || 'Unknown'}
                </span>
            )
        },
        {
            header: 'Regions',
            className: 'text-right',
            render: (c) => (
                <Link href={`/admin/countries/${c._id}/states`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg text-xs font-mono transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                    <MapPin className="w-3 h-3" /> View Regions
                </Link>
            )
        }
    ];

    if (loading) return <Loading message="Syncing Geographic Vectors..." />;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><Globe2 className="w-7 h-7 text-indigo-400 opacity-80" /> Global Nations</h1>
                    <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">Geo-Spatial Territories Matrix ({pagination.total} Nodes)</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input type="text" placeholder="Scan territories..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>
            </div>

            <CyberTable
                data={countries}
                columns={columns}
                itemsPerPage={20}
                searchTerm={searchQuery}
                searchKeys={['name', 'isoCode', 'phoneCode', 'currency']}
                emptyText="NULL OUTPUT: No territories found in vector."
                exportFilename="global_nations"
            />
        </div>
    );
}
