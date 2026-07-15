"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/core/Api/index.js';
import DynamicModal from '@/components/admin/DynamicModal.js';
import CyberTable from '@/components/admin/CyberTable.js';
import { Search, Plus, X, FileText } from 'lucide-react';
import Loading from '@/components/admin/Loading.js';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', category_slug: '', isMandatory: true });

  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (text, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ text, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  };

  // Modal Fields Configuration
  const modalFields = [
    {
      name: 'category_slug',
      label: 'Target Category',
      type: 'select',
      required: true,
      options: categories.map(cat => ({ value: cat.slug, label: cat.name }))
    },
    {
      name: 'name',
      label: 'Packet Name',
      type: 'text',
      required: true,
      onChange: (e) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData({ ...formData, name, slug });
      }
    },
    { name: 'slug', label: 'Identifier (Slug)', type: 'text', required: true },
    { name: 'isMandatory', label: 'Is Mandatory?', type: 'checkbox' }
  ];

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.admin.documents.getAll({ limit: 100 });
      if (res.success) setServices(res.data.docs || res.data || []);
    } catch (error) { showToast('Failed to load documents', 'error'); }
    finally { setLoading(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.admin.categories.getAll();
      if (res.success) setCategories(res.data || []);
    } catch (error) { }
  }, []);

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, [fetchServices, fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = editingService ? await api.admin.documents.update(editingService._id, formData) : await api.admin.documents.create(formData);
      if (res.success) {
        showToast(`Document ${editingService ? 'updated' : 'created'} successfully`);
        fetchServices();
        closeModal();
      }
    } catch (error) { showToast('Error saving document', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await api.admin.documents.delete(id);
      if (res.success) {
        showToast('Document deleted successfully');
        fetchServices();
      }
    } catch (error) { showToast('Error deleting document', 'error'); }
  };

  const handleToggleField = async (service, field) => {
    try {
      const updateData = { [field]: !service[field] };
      const res = await api.admin.documents.update(service._id, updateData);
      if (res.success) {
        showToast(`${field === 'isActive' ? 'Status' : 'Requirement'} updated`);
        fetchServices();
      }
    } catch (error) { showToast('Failed to update field', 'error'); }
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
    { header: 'S.No', className: 'w-[5%]', tdClassName: 'text-center font-mono text-[11px] text-slate-500', render: (_, i) => i + 1 },
    {
      header: 'Status',
      render: (doc) => (
        <button onClick={() => handleToggleField(doc, 'isActive')} className={`px-2 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all ${doc.isActive !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {doc.isActive !== false ? 'Active' : 'Inactive'}
        </button>
      )
    },
    { header: 'Name', render: (doc) => <div className="font-bold text-slate-200">{doc.name}</div> },
    { header: 'Slug', tdClassName: 'font-mono text-[13px] text-slate-400', render: (doc) => doc.slug },
    {
      header: 'Category',
      render: (doc) => (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {doc.category_slug}
        </span>
      )
    },
    {
      header: 'Requirement',
      render: (doc) => (
        <button onClick={() => handleToggleField(doc, 'isMandatory')} className={`px-2 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all ${doc.isMandatory ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400 border border-white/10'}`}>
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
          <button onClick={() => openModal(doc)} className="text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 p-2 rounded-lg border border-transparent hover:border-indigo-500/20" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => handleDelete(doc._id)} className="text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg border border-transparent hover:border-rose-500/20" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )
    }
  ];

  if (loading) return <Loading message="Decrypting Protocols..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><FileText className="w-7 h-7 text-indigo-400" /> Data Packets</h1>
          <p className="text-xs font-mono text-slate-500 uppercase mt-1 tracking-widest">Category Validation Documents</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input type="text" placeholder="Scan protocols..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg outline-none text-sm text-slate-200 w-64 md:w-65" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-600/40 hover:text-white transition-all font-medium text-sm">
            <Plus className="w-4 h-4" /> Add Doc
          </button>
        </div>
      </div>

      <CyberTable data={services} columns={columns} itemsPerPage={10} searchTerm={searchQuery} searchKeys={['name', 'slug', 'category_slug']} emptyText="NULL OUTPUT: No documents found." />
      <DynamicModal isOpen={isModalOpen} onClose={closeModal} title={editingService ? 'Edit Validation Doc' : 'Add Validation Doc'} fields={modalFields} formData={formData} onChange={setFormData} onSubmit={handleSubmit} />

      {/* Toast Notification */}
      {toast && (
        <>
          <style>{`
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                        .toast-animate {
                            animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                        }
                    `}</style>
          <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl toast-animate ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
            <span className="text-xs font-mono uppercase tracking-widest font-semibold">{toast.text}</span>
          </div>
        </>
      )}
    </div>
  );
}
