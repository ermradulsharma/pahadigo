'use client';
import { useState } from 'react';
import Link from 'next/link';

import CyberTable from '@/components/admin/CyberTable.js';
import { Search, MapPin, ArrowLeft } from 'lucide-react';

export default function StatesClientWrapper({ initialStates, country }) {
  const [states] = useState(initialStates);
  const [searchQuery, setSearchQuery] = useState('');

  const columns = [
    {
      header: 'S.No',
      className: 'w-[5%]',
      tdClassName: 'text-slate-500 font-mono text-[11px] text-center',
      render: (_, index) => index + 1
    },
    {
      header: 'Region Name',
      accessor: 'name',
      render: (s) => (
        <div className="font-bold text-slate-200">
          {s.name}
        </div>
      )
    },
    {
      header: 'Region Code',
      accessor: 'code',
      tdClassName: 'text-sm text-indigo-400 font-mono font-bold',
      render: (s) => s.code || '-'
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (s) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${s.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {s.isActive !== false ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><MapPin className="w-7 h-7 text-indigo-400 opacity-80" /> Regions of {country ? country.name : 'Unknown Node'}</h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">Geo-Spatial Sub-Matrix ({states.length} Instances)</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/countries" className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg text-xs font-mono transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)]">
            <ArrowLeft className="w-3 h-3" /> Abort & Return
          </Link>
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input type="text" placeholder="Scan sub-territories..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

        </div>
      </div>

      <CyberTable data={states} columns={columns} itemsPerPage={20} searchTerm={searchQuery} searchKeys={['name', 'code']} emptyText="NULL OUTPUT: No regions indexed in cluster."
        exportFilename={`states_of_${country ? country.name : 'node'}`}
      />
    </div>
  );
}
