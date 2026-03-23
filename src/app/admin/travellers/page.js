'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';

import CyberTable from '@/components/admin/CyberTable';
import { Users, Mail, Phone, Plus, Search, X } from 'lucide-react';

export default function TravellersPage() {
  const [travellers, setTravellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [editingTraveller, setEditingTraveller] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);

  const getTravellers = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/admin/travellers', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        return data.data?.travellers || []; // Adjusted for response format
      }
      return [];
    } catch (e) { }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await getTravellers();
      if (mounted) {
        setTravellers(data);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [getTravellers]);

  const handleToggleBlock = async (traveller) => {
    const newStatus = traveller.status === 'blocked' ? 'active' : 'blocked';
    if (!confirm(`Are you sure you want to ${newStatus === 'blocked' ? 'block' : 'unblock'} this traveller?`)) return;

    try {
      const token = getToken();
      const res = await fetch(`/api/admin/travellers/${traveller._id}/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTravellers(prev => prev.map(t => t._id === traveller._id ? { ...t, status: newStatus } : t));
      } else {
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error updating status.");
    }
  };

  const openEditModal = (traveller) => {
    setEditingTraveller(traveller);
    setEditForm({
      name: traveller.name || '',
      email: traveller.email || '',
      phone: traveller.phone || ''
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/travellers/${editingTraveller._id}/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (data.success) {
        alert("Traveller updated successfully!");
        setEditingTraveller(null);
        const updatedData = await getTravellers();
        setTravellers(updatedData);
      } else {
        alert("Failed: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Error updating traveller.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      header: 'Traveller Name',
      accessor: 'name',
      render: (t) => (
        <div className="flex flex-col">
          <div className="font-bold text-slate-200">{t.name || 'Anonymous User'}</div>
          <div className="text-[10px] font-mono text-indigo-400 mt-0.5">ID: {t._id}</div>
        </div>
      )
    },
    {
      header: 'Contact Info',
      accessor: 'email',
      render: (t) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono"><Mail className="w-3 h-3 text-slate-500" /> {t.email || 'N/A'}</div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono"><Phone className="w-3 h-3 text-slate-500" /> {t.phone || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (t) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[10px] font-mono uppercase tracking-widest ${t.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {t.status || 'Unknown'}
        </span>
      )
    },
    {
      header: 'Joined Date',
      accessor: 'createdAt',
      tdClassName: 'text-sm font-mono text-slate-500',
      render: (t) => t.createdAt ? new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'
    },
    {
      header: 'Actions',
      className: 'text-right',
      tdClassName: 'text-right',
      render: (t) => (
        <div className="flex justify-start gap-2">
          <button onClick={() => openEditModal(t)} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg text-xs font-mono transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)]">Edit</button>
          <button
            onClick={() => handleToggleBlock(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${t.status === 'blocked'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
              }`}>
            {t.status === 'blocked' ? 'Unblock' : 'Block'}
          </button>
        </div>
      )
    }
  ];

  if (loading) return (
    <div className="p-8 h-full flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-emerald-500 animate-spin-reverse opacity-70"></div>
        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
      </div>
      <div className="text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase animate-pulse">Decrypting User Data...</div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><Users className="w-7 h-7 text-indigo-400 opacity-80" /> Traveller Management</h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">Platform Users & Clients</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input type="text" placeholder="Scan records..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 md:w-65 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <Link href="/admin/travellers/add" className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-600/40 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] font-medium text-sm">
            <Plus className="w-4 h-4" />
            <span className="font-semibold tracking-wide">Register</span>
          </Link>
        </div>
      </div>

      <CyberTable
        data={travellers}
        columns={columns}
        itemsPerPage={10}
        searchTerm={searchQuery}
        searchKeys={['name', 'email', 'phone', '_id']}
        emptyText="NULL OUTPUT: No travellers found in vector."
        exportFilename="travellers_data"
      />

      {/* Edit Modal */}
      {editingTraveller && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,1)] w-full max-w-sm overflow-hidden flex flex-col relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-sm font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-2">Edit Traveller</h2>
              <button onClick={() => setEditingTraveller(null)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 hover:bg-rose-500/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">Full Name</label>
                  <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">Email Address</label>
                  <input type="email" required value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">Phone Number</label>
                  <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingTraveller(null)} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSaving} className={`flex-1 px-4 py-2.5 text-white font-mono text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] border flex items-center justify-center gap-2 ${isSaving ? 'bg-indigo-600/50 border-indigo-500/20 cursor-not-allowed text-indigo-300' : 'bg-indigo-600/20 border-indigo-500/40 hover:bg-indigo-600/40 text-indigo-100 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'}`}>
                    {isSaving ? 'Saving...' : 'Patch Data'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
