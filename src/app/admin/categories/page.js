"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getToken } from '../../../helpers/authUtils'; // Check relative path! src/app/admin/categories/page.js -> ../../../helpers

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
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
            console.error("Failed to fetch documents", error);
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
            console.error('Error updating status', error);
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
            console.error('Error updating mandatory status', error);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
                <button onClick={() => openModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">Add New Category</button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden text-slate-800">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr. No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-4">No categories found</td></tr>
                        ) : (
                            categories.map((cat, index) => (
                                <tr key={cat._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cat.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cat.slug}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{cat.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => handleToggleStatus(cat)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${cat.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}>{cat.isActive ? 'Active' : 'Inactive'}</button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => openDocumentsModal(cat)} className="text-emerald-600 hover:text-emerald-900 transition-colors" title="View Documents">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => openModal(cat)} className="text-indigo-600 hover:text-indigo-900 transition-colors" title="Edit">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button onClick={() => handleDelete(cat._id)} className="text-red-600 hover:text-red-900 transition-colors" title="Delete">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit/Add Category Modal */}
            {isModalOpen && (
                <div className="absolute inset-0 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-md shadow-xl w-96">
                        <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Documents Modal */}
            {viewingDocuments && (
                <div className="absolute inset-0 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-md shadow-xl w-[600px] max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {editingDoc ? 'Edit Document' : `Documents for: ${viewingDocuments.name}`}
                            </h2>
                            <button onClick={closeDocumentsModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {docsLoading ? (
                                <p className="text-center py-4">Loading documents...</p>
                            ) : editingDoc ? (
                                <form onSubmit={handleDocUpdateSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-1">Document Name</label>
                                        <input type="text" value={docFormData.name} onChange={(e) => setDocFormData({ ...docFormData, name: e.target.value })} className="w-full border rounded px-3 py-2" required />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center">
                                            <input type="checkbox" checked={docFormData.isMandatory} onChange={(e) => setDocFormData({ ...docFormData, isMandatory: e.target.checked })} className="mr-2" /> Is Mandatory?
                                        </label>
                                        <label className="flex items-center">
                                            <input type="checkbox" checked={docFormData.isActive} onChange={(e) => setDocFormData({ ...docFormData, isActive: e.target.checked })} className="mr-2" /> Is Active?
                                        </label>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <button type="button" onClick={() => setEditingDoc(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Back to List</button>
                                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Update Document</button>
                                    </div>
                                </form>
                            ) : documentsList.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No documents configured for this category.</p>
                                    <Link href={`/admin/category-documents?category_slug=${viewingDocuments.slug}`} className="text-indigo-600 hover:underline mt-2 inline-block">Manage Documents</Link>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requirement</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {documentsList.map((doc, index) => (
                                            <tr key={doc._id}>
                                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{index + 1}</td>
                                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{doc.name}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">
                                                    <button onClick={() => toggleDocMandatory(doc)} className={`text-xs px-2 py-1 rounded font-semibold transition-colors cursor-pointer ${doc.isMandatory ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} title="Click to toggle">{doc.isMandatory ? 'Mandatory' : 'Optional'}</button>
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    <button onClick={() => toggleDocStatus(doc)} className={`text-xs font-bold transition-colors cursor-pointer ${doc.isActive ? 'text-emerald-600 hover:text-emerald-700' : 'text-rose-600 hover:text-rose-700'}`} title="Click to toggle">{doc.isActive ? 'Active' : 'Inactive'}</button>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-right">
                                                    <button onClick={() => handleEditDocClick(doc)} className="text-indigo-600 hover:text-indigo-900" title="Edit Document">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
