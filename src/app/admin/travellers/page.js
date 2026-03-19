'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';

export default function TravellersPage() {
    const [travellers, setTravellers] = useState([]);
    const [loading, setLoading] = useState(true);
    
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
            const res = await fetch(`/api/admin/travellers/${traveller._id}`, {
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
            const res = await fetch(`/api/admin/travellers/${editingTraveller._id}`, {
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

    if (loading) return <div className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Loading Travellers Data...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Traveller Management</h1>
                <div className="flex gap-3">
                    <Link href="/admin/travellers/add" className="bg-indigo-600 hover:bg-indigo-700 hover:shadow-md text-white px-4 py-2 font-bold text-sm tracking-wide rounded-xl flex items-center gap-2 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Traveller
                    </Link>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                            <th className="p-5">Traveller Name</th>
                            <th className="p-5">Contact Info</th>
                            <th className="p-5">Status</th>
                            <th className="p-5">Joined Date</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50/80">
                        {travellers.map(t => (
                            <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5">
                                    <div className="font-bold text-slate-800 text-sm">{t.name || 'Anonymous User'}</div>
                                    <div className="text-[10px] font-bold text-indigo-400 mt-0.5">ID: {t._id}</div>
                                </td>
                                <td className="p-5 text-sm">
                                    <div className="flex items-center gap-2 font-semibold text-slate-600">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        {t.email || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 font-semibold text-slate-600 mt-1.5">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        {t.phone || 'N/A'}
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${t.status === 'active'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-rose-100 text-rose-700'
                                        }`}>
                                        {t.status || 'Unknown'}
                                    </span>
                                </td>
                                <td className="p-5 text-sm font-semibold text-slate-500">
                                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEditModal(t)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleToggleBlock(t)} 
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                                                t.status === 'blocked' 
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' 
                                                : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                            }`}>
                                            {t.status === 'blocked' ? 'Unblock' : 'Block'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {travellers.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-16 text-center">
                                    <div className="text-slate-400 font-bold tracking-widest uppercase text-sm">No travellers found</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingTraveller && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Edit Traveller</h2>
                            <button onClick={() => setEditingTraveller(null)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Full Name</label>
                                    <input type="text" required value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Email Address</label>
                                    <input type="email" required value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Phone Number</label>
                                    <input type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setEditingTraveller(null)} className="flex-1 px-4 py-2 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
                                    <button type="submit" disabled={isSaving} className={`flex-1 px-4 py-2 text-white font-bold rounded-xl transition-all shadow-sm ${isSaving ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}>
                                        {isSaving ? 'Saving...' : 'Save Changes'}
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
