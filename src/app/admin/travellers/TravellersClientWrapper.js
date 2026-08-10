'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CyberTable from '@/components/admin/CyberTable.js';
import { Users, Mail, Phone, Plus, Search } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext.js';
import api from '@/core/Api/index.js';
import DynamicModal from '@/components/admin/DynamicModal.js';

export default function TravellersClientWrapper({ initialTravellers }) {
    const router = useRouter();
    const [travellers, setTravellers] = useState(initialTravellers);
    const [searchQuery, setSearchQuery] = useState('');

    // Edit Modal State
    const [editingTraveller, setEditingTraveller] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    const travellerFields = [
        { name: 'name', label: 'Full Name', type: 'text', required: true, icon: 'User' },
        { name: 'email', label: 'Email Address', type: 'email', required: true, icon: 'Mail' },
        { name: 'phone', label: 'Phone Number', type: 'tel', icon: 'Phone' }
    ];

    const handleToggleBlock = async (traveller) => {
        const newStatus = traveller.status === 'blocked' ? 'active' : 'blocked';
        if (!confirm(`Are you sure you want to ${newStatus === 'blocked' ? 'block' : 'unblock'} this traveller?`)) return;

        try {
            const data = await api.admin.travellers.update(traveller._id, { status: newStatus });
            if (data.success) {
                setTravellers(prev => prev.map(t => t._id === traveller._id ? { ...t, status: newStatus } : t));
                toast(`Traveller ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully.`, 'success');
                router.refresh();
            } else {
                toast("Failed: " + (data.error || "Unknown error"), 'error');
            }
        } catch (e) {
            toast("Error updating status.", 'error');
        }
    };

    const handleDelete = async (traveller) => {
        if (!confirm(`Are you sure you want to permanently delete traveller ${traveller.name}?`)) return;

        try {
            const data = await api.admin.travellers.delete(traveller._id);
            if (data.success) {
                setTravellers(prev => prev.filter(t => t._id !== traveller._id));
                toast("Traveller deleted successfully.", 'success');
                router.refresh();
            } else {
                toast("Failed: " + (data.error || "Unknown error"), 'error');
            }
        } catch (e) {
            toast("Error deleting traveller.", 'error');
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
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const data = await api.admin.travellers.update(editingTraveller._id, editForm);
            if (data.success) {
                toast("Traveller updated successfully!", 'success');
                setEditingTraveller(null);
                router.refresh();
                // Update local state for immediate UI feedback
                setTravellers(prev => prev.map(t => t._id === editingTraveller._id ? { ...t, ...editForm } : t));
            } else {
                toast("Failed: " + (data.error || "Unknown error"), 'error');
            }
        } catch (e) {
            toast("Error updating traveller.", 'error');
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
                    <Link href={`/admin/travellers/${t._id}`} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg text-xs font-mono transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)]">View</Link>
                    <button onClick={() => openEditModal(t)} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 rounded-lg text-xs font-mono transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)]">Edit</button>
                    <button
                        onClick={() => handleToggleBlock(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${t.status === 'blocked'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                            }`}>
                        {t.status === 'blocked' ? 'Unblock' : 'Block'}
                    </button>
                    <button onClick={() => handleDelete(t)} className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg text-xs font-mono transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)]">Delete</button>
                </div>
            )
        }
    ];

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

            <DynamicModal
                isOpen={!!editingTraveller}
                onClose={() => setEditingTraveller(null)}
                title="Edit Traveller"
                fields={travellerFields}
                formData={editForm}
                onChange={setEditForm}
                onSubmit={handleEditSubmit}
                loading={isSaving}
                submitText="Patch Data"
            />
        </div>
    );
}
