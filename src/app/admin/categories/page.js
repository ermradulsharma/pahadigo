"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/core/Api';
import DynamicModal from '@/components/admin/DynamicModal';
import CyberTable from '@/components/admin/CyberTable';
import { Search, Plus, X, Layers } from 'lucide-react';
import Loading from '@/components/admin/Loading';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  // Modals for Documents
  const [viewingDocuments, setViewingDocuments] = useState(null);
  const [documentsList, setDocumentsList] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docFormData, setDocFormData] = useState({ name: '', isMandatory: false, isActive: true });
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (text, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ text, type });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4000);
  };

  // Category Modal Fields
  const categoryFields = [
    { name: 'name', label: 'Node Identity (Name)', type: 'text', required: true },
    { name: 'description', label: 'MetaData (Description)', type: 'textarea', placeholder: 'Enter category details...' }
  ];

  // Document Modal Fields
  const docFields = [
    { name: 'name', label: 'Packet Name', type: 'text', required: true },
    { name: 'isMandatory', label: 'Is Mandatory?', type: 'checkbox' },
    { name: 'isActive', label: 'Is Active?', type: 'checkbox' }
  ];

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.admin.categories.getAll();
      if (res.success) setCategories(res.data || []);
    } catch (error) { showToast('Failed to load categories', 'error'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = editingCategory ? await api.admin.categories.update(editingCategory._id, formData) : await api.admin.categories.create(formData);
      if (res.success) {
        showToast(`Category ${editingCategory ? 'updated' : 'created'} successfully!`);
        fetchCategories();
        closeModal();
      }
    } catch (error) { showToast('Error saving category', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await api.admin.categories.delete(id);
      if (res.success) {
        showToast('Category deleted successfully');
        fetchCategories();
      }
    } catch (error) { showToast('Error deleting category', 'error'); }
  };

  const handleToggleStatus = async (category) => {
    try {
      const res = await api.admin.categories.update(category._id, { isActive: !category.isActive });
      if (res.success) {
        showToast(`Category marked as ${!category.isActive ? 'Active' : 'Inactive'}`);
        fetchCategories();
      }
    } catch (error) { showToast('Failed to update status', 'error'); }
  };

  const openDocumentsModal = async (category) => {
    setViewingDocuments(category);
    setDocumentsList([]);
    setDocsLoading(true);
    try {
      const res = await api.admin.documents.getAll({ category_slug: category.slug });
      if (res.success) setDocumentsList(res.data.docs || res.data || []);
    } catch (error) { showToast('Error loading documents', 'error'); }
    finally { setDocsLoading(false); }
  };

  const handleDocUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.admin.documents.update(editingDoc._id, docFormData);
      if (res.success) {
        showToast('Document updated successfully');
        setDocumentsList(prev => prev.map(d => d._id === editingDoc._id ? { ...d, ...docFormData } : d));
        setEditingDoc(null);
      }
    } catch (error) { showToast('Error updating document', 'error'); }
  };

  const toggleDocField = async (doc, field) => {
    try {
      const updateData = { [field]: !doc[field] };
      const res = await api.admin.documents.update(doc._id, updateData);
      if (res.success) {
        showToast(`${field === 'isActive' ? 'Status' : 'Requirement'} updated`);
        setDocumentsList(prev => prev.map(d => d._id === doc._id ? { ...d, ...updateData } : d));
      }
    } catch (error) { showToast('Failed to update document', 'error'); }
  };

  const openModal = (category = null) => {
    setEditingCategory(category);
    setFormData({ name: category ? category.name : '', description: category ? category.description : '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  const closeDocumentsModal = () => {
    setViewingDocuments(null);
    setDocumentsList([]);
    setEditingDoc(null);
  };

  const columns = [
    { header: 'S.No', className: 'w-[5%]', tdClassName: 'text-slate-500 font-mono text-[11px] text-center', render: (_, index) => index + 1 },
    { header: 'Name', render: (c) => <div className="font-bold text-slate-200">{c.name}</div> },
    { header: 'Slug', tdClassName: 'text-sm text-slate-400 font-mono text-[13px]', render: (c) => c.slug },
    { header: 'Description', tdClassName: 'text-sm text-slate-400', render: (c) => c.description || '-' },
    {
      header: 'Status',
      render: (c) => (
        <button onClick={() => handleToggleStatus(c)} className={`px-2.5 py-1 rounded-sm text-[10px] font-mono tracking-widest uppercase transition-all ${c.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
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
          <button onClick={() => openDocumentsModal(c)} className="text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 p-2 rounded-lg border border-transparent hover:border-emerald-500/20 shadow-sm" title="View Documents">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </button>
          <button onClick={() => openModal(c)} className="text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 p-2 rounded-lg border border-transparent hover:border-indigo-500/20 shadow-sm" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => handleDelete(c._id)} className="text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-lg border border-transparent hover:border-rose-500/20 shadow-sm" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )
    }
  ];

  if (loading) return <Loading message="Decrypting Categories..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><Layers className="w-7 h-7 text-indigo-400 opacity-80" /> Category Core</h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">System Hierarchy Matrix</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input type="text" placeholder="Scan records..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg outline-none text-sm text-slate-200 w-64 md:w-65 shadow-sm transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-lg hover:bg-indigo-600/40 hover:text-white transition-all shadow-sm font-medium text-sm">
            <Plus className="w-4 h-4" /> <span className="font-semibold tracking-wide">Add Node</span>
          </button>
        </div>
      </div>

      <CyberTable data={categories} columns={columns} itemsPerPage={10} searchTerm={searchQuery} searchKeys={['name', 'slug', 'description']} emptyText="NULL OUTPUT: No categories found." />

      <DynamicModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Edit Hierarchy Node' : 'Initialize Hierarchy Node'}
        fields={categoryFields}
        formData={formData}
        onChange={setFormData}
        onSubmit={handleSubmit}
      />

      <DynamicModal
        isOpen={!!editingDoc}
        onClose={() => setEditingDoc(null)}
        title="Edit Data Packet"
        fields={docFields}
        formData={docFormData}
        onChange={setDocFormData}
        onSubmit={handleDocUpdateSubmit}
        submitText="Patch Packet"
      />

      {/* Documents List Modal */}
      {viewingDocuments && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,1)] w-full max-w-2xl overflow-hidden flex flex-col relative max-h-[85vh]">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-sm font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-2">Data Packets: {viewingDocuments.name}</h2>
              <button onClick={closeDocumentsModal} className="text-slate-500 hover:text-rose-400 transition-colors p-1 hover:bg-rose-500/10 rounded-lg"><X /></button>
            </div>
            <div className="p-6 overflow-y-auto">
              {docsLoading ? (
                <div className="text-center py-8 text-emerald-400 font-mono animate-pulse">Scanning Packets...</div>
              ) : documentsList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs font-mono text-slate-500 uppercase mb-4 tracking-widest">No data packets found</p>
                  <Link href={`/admin/category-documents?category_slug=${viewingDocuments.slug}`} className="px-4 py-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-600/40 transition-all font-mono text-xs uppercase tracking-wider">Configure System</Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-slate-300">
                    <thead className="bg-white/5 border-b border-white/10 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-left">
                      <tr><th className="p-3">#</th><th className="p-3">Name</th><th className="p-3">Requirement</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {documentsList.map((doc, index) => (
                        <tr key={doc._id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3 text-xs font-mono text-slate-600">{index + 1}</td>
                          <td className="p-3 text-sm font-semibold text-slate-200">{doc.name}</td>
                          <td className="p-3">
                            <button onClick={() => toggleDocField(doc, 'isMandatory')} className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-all ${doc.isMandatory ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>{doc.isMandatory ? 'Mandatory' : 'Optional'}</button>
                          </td>
                          <td className="p-3">
                            <button onClick={() => toggleDocField(doc, 'isActive')} className={`px-2 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-all ${doc.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>{doc.isActive ? 'Active' : 'Inactive'}</button>
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => setEditingDoc(doc)} className="text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 p-2 rounded-lg border border-transparent hover:border-indigo-500/20"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
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

      {/* Toast Notification */}
      {toast && (
        <>
          <style>{`
                        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                        .toast-animate { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
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
