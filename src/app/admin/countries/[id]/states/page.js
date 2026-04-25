"use client";
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { getToken } from '@/core/Helpers/authUtils';

import CyberTable from '@/components/admin/CyberTable';
import { Search, MapPin, ArrowLeft, Plus, Trash2, Globe } from 'lucide-react';
import Loading from '@/components/admin/Loading';

export default function StatesPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const { id } = params;

  const [states, setStates] = useState([]);
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 500, totalPages: 1, total: 0 }); // Increased for vector search

  useEffect(() => {
    if (id) {
      fetchCountry();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchStates(pagination.page);
    }
  }, [id, pagination.page]);

  const fetchCountry = async () => {
    try {
      const countryRes = await fetch(`/api/countries/${id}`);
      const countryData = await countryRes.json();
      if (countryData.success) {
        setCountry(countryData.data.country);
      }
    } catch (error) {
      console.error("Error fetching country", error);
    }
  };

  const fetchStates = async (page) => {
    setLoading(true);
    try {
      const statesRes = await fetch(`/api/countries/${id}/states?page=${page}&limit=${pagination.limit}`);
      const statesData = await statesRes.json();
      if (statesData.success) {
        setStates(statesData.data.states || []);
        if (statesData.data.pagination) {
          setPagination(prev => ({ ...prev, ...statesData.data.pagination }));
        }
      }
    } catch (error) {
      console.error("Error fetching states", error);
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
      accessor: 'status',
      render: (s) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {s.status || 'Unknown'}
        </span>
      )
    }
  ];

  if (loading) return <Loading message="Syncing Regional Nodes..." />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><MapPin className="w-7 h-7 text-indigo-400 opacity-80" /> Regions of {country ? country.name : 'Unknown Node'}</h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">Geo-Spatial Sub-Matrix ({pagination.total} Instances)</p>
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

      {/* Pagination Controls Wrapper for local control matching CyberTable */}
      {!loading && states.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-4">
            <span className="text-indigo-400">Total System Nodes: {pagination.total}</span>
            <span className="opacity-50">|</span>
            <span>Showing Matrix {Math.min(((pagination.page - 1) * pagination.limit) + 1, pagination.total)} - {Math.min(pagination.page * pagination.limit, pagination.total)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (pagination.page > 1) {
                  setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                }
              }}
              disabled={pagination.page === 1}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${pagination.page === 1 ? 'bg-black/20 text-slate-600 border-white/5 cursor-not-allowed' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:shadow-[0_0_10px_rgba(99,102,241,0.1)]'}`}
            >
              PREV
            </button>

            <div className="flex items-center gap-1.5 px-3">
              <span className="w-8 h-8 flex items-center justify-center font-mono text-[10px] bg-indigo-500 text-white rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-indigo-400">{pagination.page}</span>
              <span className="text-slate-500 font-mono text-xs mx-1">/</span>
              <span className="w-8 h-8 flex items-center justify-center font-mono text-[10px] bg-white/5 text-slate-400 rounded-lg">{pagination.totalPages}</span>
            </div>

            <button
              onClick={() => {
                if (pagination.page < pagination.totalPages) {
                  setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                }
              }}
              disabled={pagination.page === pagination.totalPages}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${pagination.page === pagination.totalPages ? 'bg-black/20 text-slate-600 border-white/5 cursor-not-allowed' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:shadow-[0_0_10px_rgba(99,102,241,0.1)]'}`}
            >
              NEXT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
