"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils'; // Check relative path! src/app/admin/categories/page.js -> ../../../helpers

import CyberTable from '@/components/admin/CyberTable';
import { Search, Plus, X, Layers } from 'lucide-react';

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                setCategories(data.data.categories || []);
            }
        } catch (error) { }
        finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingCategory
                ? `/api/categories/${editingCategory._id}`
                : '/api/categories';
            const method = editingCategory ? 'PUT' : 'POST';

            const token = getToken(); // Need token for protected routes
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchCategories();
                closeModal();
            } else {
                alert('Failed to save category');
            }
        } catch (error) {
            alert('Error saving category');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this category?')) return;

        try {
            const token = getToken();
            const res = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                fetchCategories();
            }
        } catch (error) {
            alert('Error deleting category');
        }
    };

    const handleToggleStatus = async (category) => {
        try {
            const token = getToken();
            const res = await fetch(`/api/categories/${category._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ isActive: !category.isActive })
            });
            if (res.ok) {
                fetchCategories();
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            alert('Error updating status');
        }
    };

    const openModal = (category = null) => {
        setEditingCategory(category);
        setFormData({
            name: category ? category.name : '',
            description: category ? category.description : ''
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '' });
    };

    const [viewingDocuments, setViewingDocuments] = useState(null);
    const [documentsList, setDocumentsList] = useState([]);
    const [docsLoading, setDocsLoading] = useState(false);

    const openDocumentsModal = async (category) => {
        setViewingDocuments(category);
        setDocumentsList([]);
        setDocsLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/category-documents?category_slug=${category.slug}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (data.success) {
                setDocumentsList(data.data.docs || data.data || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDocsLoading(false);
        }
    };

    const closeDocumentsModal = () => {
        setViewingDocuments(null);
        setDocumentsList([]);
        setEditingDoc(null);
    };

    const [editingDoc, setEditingDoc] = useState(null);
    const [docFormData, setDocFormData] = useState({ name: '', isMandatory: false, isActive: true });

    const handleEditDocClick = (doc) => {
        setEditingDoc(doc);
        setDocFormData({
            name: doc.name,
            isMandatory: doc.isMandatory || false,
            isActive: doc.isActive
        });
    };

    const handleDocUpdateSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/category-documents/${editingDoc._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(docFormData)
            });

            if (res.ok) {
                // Refresh list locally
                setDocumentsList(prev => prev.map(d => d._id === editingDoc._id ? { ...d, ...docFormData } : d));
                setEditingDoc(null);
            } else {
                alert('Failed to update document');
            }
        } catch (error) {
            alert('Error updating document');
        }
    };

    const toggleDocStatus = async (doc) => {
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/category-documents/${doc._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ isActive: !doc.isActive })
            });

            if (res.ok) {
                setDocumentsList(prev => prev.map(d => d._id === doc._id ? { ...d, isActive: !d.isActive } : d));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleDocMandatory = async (doc) => {
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/category-documents/${doc._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ isMandatory: !doc.isMandatory })
            });

            if (res.ok) {
                setDocumentsList(prev => prev.map(d => d._id === doc._id ? { ...d, isMandatory: !d.isMandatory } : d));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const columns = [
        {
            header: 'S.No',
            className: 'w-[5%]',
            tdClassName: 'text-slate-500 font-mono text-[11px] text-center',
            render: (_, index) => index + 1
        },
        {
            header: 'Name',
            accessor: 'name',
            render: (c) => (
                <div className="font-bold text-slate-200">{c.name}</div>
            )
        },
        {
            header: 'Slug',
            accessor: 'slug',
            tdClassName: 'text-sm text-slate-400 font-mono text-[13px]',
            render: (c) => c.slug
        },
        {
            header: 'Description',
            accessor: 'description',
            tdClassName: 'text-sm text-slate-400',
            render: (c) => c.description || '-'
        },
        {
            header: 'Status',
            accessor: 'isActive',
            render: (c) => (
                <button onClick={() => handleToggleStatus(c)} className={`px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] ${c.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                </button>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            tdClassName: 'text-right',
            render: (c) => (
                <div className="flex justify-end gap-2">
                    <button onClick={() => openDocumentsModal(c)} className="text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-lg border border-transparent hover:border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" title="View Documents">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button onClick={() => openModal(c)} className="text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 p-2 rounded-lg border border-transparent hover:border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg border border-transparent hover:border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]" title="Delete">
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
            <div className="text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase animate-pulse">Decrypting Categories...</div>
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><Layers className="w-7 h-7 text-indigo-400 opacity-80" /> Category Core</h1>
                    <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">System Hierarchy Matrix</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input type="text" placeholder="Scan records..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 md:w-65 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-600/40 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.1)] hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] font-medium text-sm">
                        <Plus className="w-4 h-4" />
                        <span className="font-semibold tracking-wide">Add Node</span>
                    </button>
                </div>
            </div>

            <CyberTable
                data={categories}
                columns={columns}
                itemsPerPage={10}
                searchTerm={searchQuery}
                searchKeys={['name', 'slug', 'description']}
                emptyText="NULL OUTPUT: No categories found in vector."
                exportFilename="categories_data"
            />

            {/* Edit/Add Category Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
                    <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,1)] w-full max-w-sm overflow-hidden flex flex-col relative">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-sm font-mono text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                {editingCategory ? 'Edit Hierarchy Node' : 'Initialize Hierarchy Node'}
                            </h2>
                            <button onClick={closeModal} className="text-slate-500 hover:text-rose-400 transition-colors p-1 hover:bg-rose-500/10 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">Node Identity (Name)</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">MetaData (Description)</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 min-h-[100px]" />
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

            {/* View Documents Modal */}
            {viewingDocuments && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
                    <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,1)] w-full max-w-2xl overflow-hidden flex flex-col relative max-h-[85vh]">
                        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                {editingDoc ? 'Edit Data Packet' : `Data Packets: ${viewingDocuments.name}`}
                            </h2>
                            <button onClick={closeDocumentsModal} className="text-slate-500 hover:text-rose-400 transition-colors p-1 hover:bg-rose-500/10 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {docsLoading ? (
                                <div className="flex flex-col items-center py-8">
                                    <div className="w-8 h-8 rounded-full border-t-2 border-emerald-500 animate-spin mb-4"></div>
                                    <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest animate-pulse">Scanning Packets...</p>
                                </div>
                            ) : editingDoc ? (
                                <form onSubmit={handleDocUpdateSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">Packet Name</label>
                                        <input type="text" value={docFormData.name} onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })} required className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-600" />
                                    </div>
                                    <div className="flex items-center gap-6 py-2">
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" checked={docFormData.isMandatory} onChange={(e) => setDocFormData({ ...docFormData, isMandatory: e.target.checked })} className="form-checkbox bg-black border-white/20 text-emerald-500 rounded ring-offset-0 focus:ring-0" />
                                            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 group-hover:text-slate-200 transition-colors">Is Mandatory?</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input type="checkbox" checked={docFormData.isActive} onChange={(e) => setDocFormData({ ...docFormData, isActive: e.target.checked })} className="form-checkbox bg-black border-white/20 text-emerald-500 rounded ring-offset-0 focus:ring-0" />
                                            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 group-hover:text-slate-200 transition-colors">Is Active?</span>
                                        </label>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button type="button" onClick={() => setEditingDoc(null)} className="px-4 py-2.5 bg-white/5 border border-white/10 text-slate-300 font-mono text-xs uppercase tracking-wider rounded-lg hover:bg-white/10 transition-colors">Abort</button>
                                        <button type="submit" className="px-4 py-2.5 bg-emerald-600/20 text-emerald-100 border border-emerald-500/40 hover:bg-emerald-600/40 font-mono text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">Patch Packet</button>
                                    </div>
                                </form>
                            ) : documentsList.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em] mb-4">No data packets found</p>
                                    <Link href={`/admin/category-documents?category_slug=${viewingDocuments.slug}`} className="px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-600/40 transition-all font-mono text-xs uppercase tracking-wider">Configure System</Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto text-left">
                                    <table className="w-full text-slate-300">
                                        <thead className="bg-white/5 border-b border-white/10 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                                            <tr>
                                                <th className="p-3 font-normal">#</th>
                                                <th className="p-3 font-normal">Name</th>
                                                <th className="p-3 font-normal">Requirement</th>
                                                <th className="p-3 font-normal">Status</th>
                                                <th className="p-3 font-normal text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {documentsList.map((doc, index) => (
                                                <tr key={doc._id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-3 text-xs font-mono text-slate-600">{index + 1}</td>
                                                    <td className="p-3 text-sm font-semibold text-slate-200">{doc.name}</td>
                                                    <td className="p-3 text-sm">
                                                        <button onClick={() => toggleDocMandatory(doc)} className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-all ${doc.isMandatory ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20'}`}>{doc.isMandatory ? 'Mandatory' : 'Optional'}</button>
                                                    </td>
                                                    <td className="p-3 text-sm">
                                                        <button onClick={() => toggleDocStatus(doc)} className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-all ${doc.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'}`}>{doc.isActive ? 'Active' : 'Inactive'}</button>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <button onClick={() => handleEditDocClick(doc)} className="text-indigo-400 hover:text-indigo-300 p-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
