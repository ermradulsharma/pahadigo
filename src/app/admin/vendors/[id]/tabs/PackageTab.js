'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VendorHeader, StatusBadge } from '@/components/admin/VendorUIFragments';
import PackageCard from '@/components/admin/PackageCard';
import { getToken } from '@/helpers/authUtils';
import { Layers, Mountain, Home, Car, Tent, Map, Zap, Bike, Building, Waves, Milestone, Luggage, FileText, Search, X, Check, X as XIcon, Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

export default function PackageTab({ vendor, packages, setPackages, id, activeTab, setActiveTab }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewingDocs, setViewingDocs] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const vendorProfile = vendor?.vendorProfile || vendor;
  const vendorCategories = vendorProfile?.category || [];
  const vendorPackages = vendor?.VendorPackage || {};

  const getCategoryBucket = (slug) => {
    const mapping = {
      'trekking': 'trekking',
      'homestay': 'homestay',
      'hotel': 'hotel',
      'camping': 'camping',
      'rafting': 'rafting',
      'bungee-jumping': 'bungeeJumping',
      'taxi-rental': 'vehicleRental',
      'bike-scooter-rental': 'vehicleRental', // Both might point here
      'chardham-tour': 'chardhamTour',
      'custom-trip': 'customTrip',
      'skiing': 'skiing',
      'paragliding': 'paragliding',
      'tour-package': 'tourPackage'
    };
    return mapping[slug] || slug;
  };

  const getCategoryIcon = (slug) => {
    const icons = {
      'trekking': Mountain,
      'homestay': Home,
      'hotel': Building,
      'taxi-rental': Car,
      'bike-scooter-rental': Bike,
      'camping': Tent,
      'rafting': Waves,
      'bungee-jumping': Zap,
      'chardham-tour': Milestone,
      'custom-trip': Luggage,
      'tour-package': Map,
    };
    const Icon = icons[slug] || Layers;
    return <Icon className="w-6 h-6" />;
  };

  const handleDocsClick = (cat) => {
    const categoryDocs = (vendor?.vendorDocuments || []).filter(doc => doc.category_slug === cat.slug);
    setViewingDocs({
      categorySlug: cat.slug,
      categoryName: cat.name,
      docs: categoryDocs
    });
  };

  const updateDocumentStatus = async (doc, newStatus) => {
    let reason = null;
    if (newStatus === VERIFICATION_STATUS.REJECTED) {
      reason = window.prompt("Please enter the reason for rejection:");
      if (!reason || reason.trim() === "") {
        alert("Rejection reason is mandatory!");
        return;
      }
    }

    // Optimistic UI update
    if (viewingDocs) {
      const updatedDocs = viewingDocs.docs.map(d =>
        d._id === doc._id ? { ...d, status: newStatus, rejection_reason: reason } : d
      );
      setViewingDocs({ ...viewingDocs, docs: updatedDocs });
    }

    try {
      const token = getToken();
      const response = await fetch('/api/admin/verify-category-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          documentId: doc._id,
          userId: doc.user_id,
          vendorId: doc.vendor_id,
          status: newStatus,
          reason: reason
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        handleDocsClick({ slug: viewingDocs.categorySlug, name: viewingDocs.categoryName });
      }
    } catch (error) {
      console.error("Network Error:", error);
    }
  };

  const handlePackageToggleStatus = async (pkg, newActive) => {
    try {
      const token = getToken();
      const catBucket = getCategoryBucket(selectedCategory);
      const response = await fetch(`/api/admin/packages/${pkg._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          vendorId: vendorProfile._id,
          userId: vendorProfile.user,
          serviceId: pkg._id,
          status: newActive,
          serviceType: catBucket
        })
      });

      if (!response.ok) alert("Failed to toggle status");
      else router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 relative text-left">
      <VendorHeader vendor={vendor} onBack={() => selectedCategory ? setSelectedCategory(null) : router.back()} id={id} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-[1600px] mx-auto px-8 py-8 relative z-10">
        {!selectedCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vendorCategories.map((cat) => (
              <div key={cat.slug} className="group bg-[#111116] p-8 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-indigo-500/50 transition-all text-left relative overflow-hidden">
                <div className="relative z-10">
                  <div className='flex justify-between items-start mb-6'>
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">{getCategoryIcon(cat.slug)}</div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDocsClick(cat)} className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-mono font-bold hover:bg-indigo-500/20 transition-all cursor-pointer uppercase">DOCS</button>
                      <button onClick={() => setSelectedCategory(cat.slug)} className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-mono font-bold hover:bg-cyan-500/20 transition-all cursor-pointer uppercase">PACKAGES</button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold font-mono text-cyan-50 mb-1 uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{cat.name}</h3>
                  <p className="text-slate-600 text-[10px] font-mono font-bold uppercase tracking-widest">
                    {(vendorPackages[getCategoryBucket(cat.slug)] || []).length} Nodes active
                  </p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent group-hover:via-cyan-400 transition-all"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedCategory(null)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all">Return</button>
              <div className="h-4 w-[1px] bg-white/10"></div>
              <h2 className="text-sm font-bold font-mono text-cyan-400 uppercase tracking-widest">Category: {selectedCategory.replace(/-/g, ' ')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(vendorPackages[getCategoryBucket(selectedCategory)] || []).map((pkg) => (
                <PackageCard key={pkg._id} pkg={pkg} inspectHref={`/admin/packages/item/${pkg._id}`} onToggleStatus={handlePackageToggleStatus} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Admin Verification Modal with Mandatory Rejection Reason */}
      {viewingDocs && (
        <div id="docs-modal" tabIndex="-1" role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex justify-center items-center backdrop-blur-sm bg-black/60 p-4 md:pl-64 overflow-hidden animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl max-h-[95vh] animate-in zoom-in-95 duration-200">
            <div className="relative bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-5 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white flex items-center gap-3 font-mono uppercase tracking-[0.2em]"><FileText className="w-5 h-5 text-cyan-400" /> {viewingDocs.categoryName} <span className='text-slate-500'>/</span> Verification</h3>
                <button onClick={() => setViewingDocs(null)} type="button" className="text-slate-500 hover:text-white transition-all bg-white/5 p-2 rounded-lg"><X size={20} /></button>
              </div>
              <div className="p-6 md:p-8 overflow-y-auto max-h-[75vh]">
                {viewingDocs.docs && viewingDocs.docs.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {viewingDocs.docs.map((doc, idx) => (
                      <div key={idx} className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col group hover:border-white/10 transition-all">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{doc.document_slug.replace(/-/g, ' ')}</span>
                          <StatusBadge status={doc.status} />
                        </div>
                        <div className="relative h-48 w-full bg-black cursor-zoom-in" onClick={() => setPreviewImage(doc.url)}>
                          <Image src={doc.url} alt="doc" fill sizes="(max-width: 1024px) 100vw, 500px" className="object-cover opacity-70 group-hover:opacity-100 transition-all" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"><Search size={24} className="text-white" /></div>
                        </div>
                        <div className="p-4 bg-white/[0.02] flex flex-col gap-3 border-t border-white/5">
                          <div className='flex items-center gap-2 justify-center'>
                            <span className="text-[9px] font-mono font-bold text-slate-600 uppercase mr-auto hidden sm:block">Control:</span>
                            <button onClick={() => updateDocumentStatus(doc, VERIFICATION_STATUS.VERIFIED)} className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${doc.status === VERIFICATION_STATUS.VERIFIED ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-slate-500 border border-white/10 hover:bg-green-500/10 hover:text-green-400'}`}><Check size={10} /> {VERIFICATION_STATUS.VERIFIED}</button>
                            <button onClick={() => updateDocumentStatus(doc, VERIFICATION_STATUS.PENDING)} className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${doc.status === VERIFICATION_STATUS.PENDING ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 border border-white/10 hover:bg-amber-500/10 hover:text-amber-400'}`}><Clock size={10} /> {VERIFICATION_STATUS.PENDING}</button>
                            <button onClick={() => updateDocumentStatus(doc, VERIFICATION_STATUS.REJECTED)} className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${doc.status === VERIFICATION_STATUS.REJECTED ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-500 border border-white/10 hover:bg-rose-500/10 hover:text-rose-400'}`}><XIcon size={10} /> {VERIFICATION_STATUS.REJECTED}</button>
                          </div>
                          {doc.status === VERIFICATION_STATUS.REJECTED && doc.rejection_reason && (
                            <div className="px-3 py-2 bg-rose-500/5 border border-rose-500/10 rounded-lg flex items-start gap-2">
                              <AlertCircle size={12} className="text-rose-400 mt-0.5" />
                              <p className="text-[10px] text-rose-400/80 font-mono italic">Reason: {doc.rejection_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <Search className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-40" />
                    <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">No Sector Compliance Found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Overlay */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-12 cursor-zoom-out animate-in fade-in duration-300">
          <div className="relative w-full h-full flex flex-col items-center justify-center max-w-5xl">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.2)] border border-white/10 bg-[#0a0a0f]">
              <Image src={previewImage} alt="Document Review" fill sizes="100vw" className="object-contain" priority />
            </div>
            <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full border border-white/10 backdrop-blur-md">
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
