"use client";
import { useState, useEffect, useCallback } from 'react';
import { getToken } from '@/helpers/authUtils';

import CyberTable from '@/components/admin/CyberTable';
import { Search, Plus, X, FileText } from 'lucide-react';

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category_slug: '',
        isMandatory: true
    });

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(100); // Fetch more for local table filtering

    const fetchServices = useCallback(async () => {
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/category-documents?page=${page}&limit=${limit}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();

            if (data && data.success) {
                if (data.data) {
                    if (data.data.docs && Array.isArray(data.data.docs)) {
                        setServices(data.data.docs);
                        setTotalPages(data.data.totalPages || 1);
                    } else if (Array.isArray(data.data)) {
                        setServices(data.data);
                    } else {
                        setServices([]);
                    }
                } else {
                    setServices([]);
                }
            }
        } catch (error) { }
        finally {
            setLoading(false);
        }
    }, [page, limit]);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data.categories || []);
            }
        } catch (error) { }
    }, []);

    useEffect(() => {
        fetchServices();
        fetchCategories();
    }, [fetchServices, fetchCategories]);

    const handleNameChange = (e) => {
        const name = e.target.value;
        const slug = name.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
        setFormData({ ...formData, name, slug });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingService ? `/api/admin/category-documents/${editingService._id}` : '/api/admin/category-documents';
            const method = editingService ? 'PUT' : 'POST';

            const token = getToken();
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchServices();
                closeModal();
            } else {
                alert('Failed to save document config');
            }
        } catch (error) {
            alert('Error saving document config');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this document config?')) return;

        try {
            const token = getToken();
            const res = await fetch(`/api/admin/category-documents/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                fetchServices();
            }
        } catch (error) {
            alert('Error deleting document config');
        }
    };

    const handleToggleStatus = async (service) => {
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/category-documents/${service._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ isActive: !service.isActive })
            });
            if (res.ok) {
                fetchServices();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            alert('Error updating status');
        }
    };

    const handleToggleMandatory = async (service) => {
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/category-documents/${service._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ isMandatory: !service.isMandatory })
            });
            if (res.ok) {
                fetchServices();
            } else {
                alert('Failed to update mandatory status');
            }
        } catch (error) {
            alert('Error updating mandatory status');
        }
    };

    const openModal = (service = null) => {
        setEditingService(service);
        if (service) {
            setFormData({
                name: service.name,
                slug: service.slug,
                category_slug: service.category_slug,
                isMandatory: service.isMandatory
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                category_slug: categories.length > 0 ? categories[0].slug : '',
                isMandatory: true
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
        setFormData({ name: '', slug: '', category_slug: '', isMandatory: true });
    };

    const columns = [
        {
            header: 'S.No',
            className: 'w-[5%]',
            tdClassName: 'text-slate-500 font-mono text-[11px] text-center',
            render: (_, index) => index + 1
        },
        {
            header: 'Status',
            accessor: 'isActive',
            render: (doc) => (
                <button
                    onClick={() => handleToggleStatus(doc)}
                    className={`px-2 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all shadow-sm ${doc.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'}`}
                >
                    {doc.isActive !== false ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            header: 'Name',
            accessor: 'name',
            render: (doc) => <div className="font-bold text-slate-200">{doc.name}</div>
        },
        {
            header: 'Slug',
            accessor: 'slug',
            tdClassName: 'text-sm text-slate-400 font-mono text-[13px]',
            render: (doc) => doc.slug
        },
        {
            header: 'Category',
            accessor: 'category_slug',
            render: (doc) => (
                <span className="px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {doc.category_slug}
                </span>
            )
        },
        {
            header: 'Requirement',
            accessor: 'isMandatory',
            render: (doc) => (
                <button
                    onClick={() => handleToggleMandatory(doc)}
                    className={`px-2 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all shadow-sm ${doc.isMandatory ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-slate-800 text-slate-400 border border-white/10 hover:bg-slate-700'}`}
                >
                    {doc.isMandatory ? 'Required' : 'Optional'}
                </button>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            tdClassName: 'text-right',
            render: (doc) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => openModal(doc)} className="text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 p-2 rounded-lg border border-transparent hover:border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button onClick={() => handleDelete(doc._id)} className="text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg border border-transparent hover:border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
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
            <div className="text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase animate-pulse">Decrypting Protocol Data...</div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><FileText className="w-7 h-7 text-indigo-400 opacity-80" /> Data Packets</h1>
                    <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">Category Validation Documents</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input type="text" placeholder="Scan protocols..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 md:w-65 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-600/40 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] font-medium text-sm">
                        <Plus className="w-4 h-4" />
                        <span className="font-semibold tracking-wide">Add Doc</span>
                    </button>
                </div>
            </div>

            <CyberTable
                data={services}
                columns={columns}
                itemsPerPage={10}
                searchTerm={searchQuery}
                searchKeys={['name', 'slug', 'category_slug']}
                emptyText="NULL OUTPUT: No documents configured."
                exportFilename="document_configs"
            />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
                    <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,1)] w-full max-w-sm overflow-hidden flex flex-col relative">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-sm font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                {editingService ? 'Edit Validation Doc' : 'Add Validation Doc'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-500 hover:text-rose-400 transition-colors p-1 hover:bg-rose-500/10 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Target Category</label>
                                    <select value={formData.category_slug} onChange={(e) => setFormData({ ...formData, category_slug: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 appearance-none" required>
                                        <option value="" className="bg-black">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat.slug} className="bg-black">{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Packet Name</label>
                                    <input type="text" value={formData.name} onChange={handleNameChange} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Identifier (Slug)</label>
                                    <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-mono text-[11px]" required />
                                </div>
                                <div className="py-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={formData.isMandatory} onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })} className="form-checkbox bg-black border-white/20 text-indigo-500 rounded ring-offset-0 focus:ring-0" />
                                        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 group-hover:text-slate-200 transition-colors">Is Mandatory?</span>
                                    </label>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={closeModal} className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors">Abort</button>
                                    <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600/20 text-indigo-100 border border-indigo-500/40 hover:bg-indigo-600/40 font-mono text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                                        Deploy
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
