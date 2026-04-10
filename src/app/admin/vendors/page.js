'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import { Search, Plus, Eye, Package as PackageIcon, ShieldAlert, CheckCircle2, Factory, X, User as UserIcon, Mail, Phone, Lock, Trash2 } from 'lucide-react';
import CyberTable from '@/components/admin/CyberTable';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add Vendor Modal State
  const [addLoading, setAddLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [newVendor, setNewVendor] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleBulkDelete = async (selectedVendors) => {
    if (!confirm(`WARNING: Are you sure you want to terminate ${selectedVendors.length} network nodes? This action is irreversible.`)) return;
    setBulkLoading(true);
    try {
      const token = getToken();
      let successCount = 0;
      for (const vendor of selectedVendors) {
        const res = await fetch(`/api/admin/vendors/${vendor._id}/delete`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) successCount++;
      }
      alert(`Bulk Action Complete: Terminated ${successCount}/${selectedVendors.length} nodes.`);
      const updated = await getVendors();
      setVendors(updated);
    } catch (e) {
      alert("Error executing bulk termination.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkApprove = async (selectedVendors) => {
    if (!confirm(`Authorize ${selectedVendors.length} nodes for network access?`)) return;
    setBulkLoading(true);
    try {
      const token = getToken();
      let successCount = 0;
      for (const vendor of selectedVendors) {
        const res = await fetch(`/api/admin/vendors/${vendor._id}/approve`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) successCount++;
        else {
          // Fallback to update status if explicit endpoint fails
          const fallbackRes = await fetch(`/api/admin/vendors/${vendor._id}/update`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ isApproved: true })
          });
          if (fallbackRes.ok) successCount++;
        }
      }
      alert(`Bulk Action Complete: Authorized ${successCount}/${selectedVendors.length} nodes.`);
      const updated = await getVendors();
      setVendors(updated);
    } catch (e) {
      alert("Error executing bulk authorization.");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/admin/vendors/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newVendor)
      });
      const data = await res.json();
      if (data.success) {
        alert("Vendor Node Created!");
        setIsModalOpen(false);
        setNewVendor({ businessName: '', ownerName: '', email: '', phone: '', password: '' });
        const updated = await getVendors();
        setVendors(updated);
      } else {
        alert("Failed: " + (data.error || data.message));
      }
    } catch (error) {
      alert("An error occurred.");
    } finally {
      setAddLoading(false);
    }
  };

  const getVendors = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/admin/vendors', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        return data.data?.vendors || [];
      }
      return [];
    } catch (e) { }
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await getVendors();
      console.log(data);
      if (mounted) {
        setVendors(data);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [getVendors]);

  const columns = [
    {
      header: 'S.No',
      className: 'w-[5%]',
      tdClassName: 'text-slate-500 font-mono text-[11px] text-center',
      render: (_, index) => index + 1
    },
    {
      header: 'Identifier',
      accessor: 'ownerName', // Used for sorting
      className: 'w-1/4',
      render: (v) => (
        <div className="flex flex-col items-start gap-1">
          <div className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors flex items-center gap-2">{v.ownerName || v.businessName || 'Unknown Entity'}</div>
        </div>
      )
    },
    {
      header: 'Comm Link',
      tdClassName: 'text-sm text-slate-400 font-mono text-[13px]',
      render: (v) => v.email || v.businessEmail || 'OFFLINE'
    },
    {
      header: 'Telecom',
      tdClassName: 'text-sm text-slate-400 font-mono text-[13px]',
      render: (v) => v.phone || v.businessNumber || 'UNAVAILABLE'
    },
    {
      header: 'Clearance',
      accessor: 'isApproved',
      render: (v) => {
        if (v.hasProfile && v.isApproved) {
          return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"><CheckCircle2 className="w-3 h-3" /> Verified Node </div>;
        }
        if (v.hasProfile && !v.isApproved) {
          return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"><ShieldAlert className="w-3 h-3" /> Pending Scan </div>;
        }
        return <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20"><Lock className="w-3 h-3" /> Initialization </div>;
      }
    },
    {
      header: 'Telemetry',
      className: 'text-right',
      tdClassName: 'text-right',
      render: (v) => (
        <div className="flex justify-end gap-2 items-center opacity-70 group-hover:opacity-100 transition-opacity">
          <Link href={`/admin/vendors/${v._id}`} title="Access Node Profile" className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg border border-transparent hover:border-indigo-500/20 transition-all hover:shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            <Eye className="w-4 h-4" />
          </Link>
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
      <div className="text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase animate-pulse">Decrypting Vendor Nodes...</div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><Factory className="w-7 h-7 text-indigo-400 opacity-80" /> Vendor Network</h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">Authorized Supply Chain Nodes</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input type="text" placeholder="Scan Nodes..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 md:w-65 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-600/40 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] font-medium text-sm"><Plus className="w-4 h-4" /><span className="font-semibold tracking-wide">Register</span></button>
        </div>
      </div>

      <CyberTable
        data={vendors}
        columns={columns}
        itemsPerPage={10}
        searchTerm={searchQuery}
        searchKeys={['user.name', 'ownerName', 'user.email', 'businessName']}
        emptyText="NULL OUTPUT: No nodes found in current vector."
        exportFilename="vendor_nodes"
        bulkActions={(selectedVendors) => (
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkDelete(selectedVendors)} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 rounded-lg text-xs font-mono tracking-wider transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)] disabled:opacity-50 disabled:cursor-not-allowed">
              <Trash2 className="w-3.5 h-3.5" /> Terminate
            </button>
            <button onClick={() => handleBulkApprove(selectedVendors)} disabled={bulkLoading} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg text-xs font-mono tracking-wider transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] disabled:opacity-50 disabled:cursor-not-allowed">
              <CheckCircle2 className="w-3.5 h-3.5" /> Authorize
            </button>
          </div>
        )}
        renderExpandableRow={(v) => (
          <div className="grid grid-cols-1">
            <div className="space-y-2">
              <h4 className="text-xs font-mono text-indigo-400 uppercase tracking-widest border-b border-indigo-500/20 pb-2 mb-3">System Identity</h4>
              <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">UUID:</span> {v._id}</p>
              <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">Business Name:</span> {v.businessName}</p>
              <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">Owner Name:</span> {v.ownerName}</p>
              <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">Registration:</span> {v.businessRegistration}</p>
              <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">GSTTIN:</span> {v.gstNumber}</p>
              <p className="font-mono text-[11px] text-slate-400"><span className="text-slate-500 inline-block w-24">Created:</span> {new Date(v.createdAt).toUTCString()}</p>
            </div>
          </div>
        )}
      />
      {/* Add Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,1)] w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] relative">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-sm font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Register New Node
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-rose-400 transition-colors p-1 hover:bg-rose-500/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleAddVendor} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Factory className="w-3 h-3 text-indigo-400/70" /> Business Identity *
                  </label>
                  <input type="text" required value={newVendor.businessName} onChange={e => setNewVendor({ ...newVendor, businessName: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" placeholder="Aero Travels Protocol" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3 h-3 text-indigo-400/70" /> Admin Operator
                  </label>
                  <input type="text" value={newVendor.ownerName} onChange={e => setNewVendor({ ...newVendor, ownerName: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" placeholder="Trinity" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-indigo-400/70" /> Comm Link (Email) *
                  </label>
                  <input type="email" required value={newVendor.email} onChange={e => setNewVendor({ ...newVendor, email: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" placeholder="sys@domain.com" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-indigo-400/70" /> Data Frequency (Phone) *
                  </label>
                  <input type="tel" required value={newVendor.phone} onChange={e => setNewVendor({ ...newVendor, phone: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" placeholder="+1..." />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-indigo-400/70" /> Master Key (Password) *
                  </label>
                  <input type="password" required value={newVendor.password} onChange={e => setNewVendor({ ...newVendor, password: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" placeholder="••••••••" />
                </div>

                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors">Abort</button>
                  <button type="submit" disabled={addLoading} className={`flex-1 px-4 py-2.5 text-white font-mono text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] border flex items-center justify-center gap-2 ${addLoading ? 'bg-indigo-600/50 border-indigo-500/20 cursor-not-allowed text-indigo-300' : 'bg-indigo-600/20 border-indigo-500/40 hover:bg-indigo-600/40 text-indigo-100 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'}`}>
                    {addLoading ? (
                      <><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Syncing...</>
                    ) : 'Deploy Node'}
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
