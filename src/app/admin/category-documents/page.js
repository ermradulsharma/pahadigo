"use client";
import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../../../helpers/authUtils';

export default function ServicesPage() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        category_slug: '',
        isMandatory: true
    });

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);

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
                        console.warn('Unexpected data structure:', data.data);
                        setServices([]);
                    }
                } else {
                    setServices([]);
                }
            } else {
            }
        } catch (error) { }
        finally {
            setLoading(false);
        }
    }, [page, limit]);

    const fetchCategories = useCallback(async () => {
        try {
            // Using public endpoint for categories
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
                alert('Failed to save service');
            }
        } catch (error) {
            alert('Error saving service');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this service?')) return;

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
            alert('Error deleting service');
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

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Category Documents</h1>
                <button onClick={() => openModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">Add New Document</button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden text-slate-800">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Mandatory</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
                        ) : services.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-4">No documents found</td></tr>
                        ) : (
                            services.map((service) => (
                                <tr key={service._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleToggleStatus(service)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${service.isActive
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
                                        >
                                            {service.isActive !== false ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{service.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.slug}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{service.category_slug}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => handleToggleMandatory(service)}
                                            className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${service.isMandatory
                                                ? 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'}`}
                                        >
                                            {service.isMandatory ? 'Required' : 'Optional'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(service)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        <button onClick={() => handleDelete(service._id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
                <div className="text-gray-600 text-sm">Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className={`px-3 py-1 rounded-md text-sm font-medium ${page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}>Previous</button>
                    <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className={`px-3 py-1 rounded-md text-sm font-medium ${page === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}>Next</button>
                </div>
            </div>

            {isModalOpen && (
                <div className="absolute inset-0 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-md shadow-xl w-96">
                        <h2 className="text-xl font-bold mb-4">{editingService ? 'Edit Document' : 'Add New Document'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                                <select value={formData.category_slug} onChange={(e) => setFormData({ ...formData, category_slug: e.target.value })} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required>
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat.slug}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                <input type="text" value={formData.name} onChange={handleNameChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Slug</label>
                                <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" required />
                            </div>
                            <div className="mb-4">
                                <label className="flex items-center">
                                    <input type="checkbox" checked={formData.isMandatory} onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })} className="form-checkbox h-5 w-5 text-indigo-600" />
                                    <span className="ml-2 text-gray-700">Is Mandatory?</span>
                                </label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={closeModal} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Cancel</button>
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
