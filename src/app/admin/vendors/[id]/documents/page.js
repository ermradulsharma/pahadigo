'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import Image from 'next/image';
import VendorTabs from '@/components/admin/VendorTabs';
import { StatusBadge } from '@/components/admin/VendorUIFragments';

export default function VendorCategoryDocumentsPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const router = useRouter();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/admin/vendors', {
          headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
          const data = await res.json();
          const vendors = data.data?.vendors || [];
          const found = vendors.find(v => v._id === id);
          if (found) setVendor(found);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id, refreshKey]);

  const verifyCategoryDoc = async (docId, status, reason = '') => {
    try {
      const token = getToken();
      const body = { documentId: docId, status, reason };

      const res = await fetch('/api/admin/verify-category-document', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setRefreshKey(old => old + 1);
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      alert('An error occurred during verification');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-[13px] font-medium text-slate-500">Loading Documents...</p>
    </div>
  );

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Vendor not found</h2>
        <button onClick={() => router.back()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-sm hover:bg-indigo-700 transition active:scale-95">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Header Section */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                <Link href="/admin/vendors" className="hover:text-indigo-600 transition-colors">Vendors</Link>
                <span>/</span>
                <span className="text-slate-600">Category Documents</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">{vendor.businessName}</h1>
            </div>
          </div>
        </div>
      </header>

      <VendorTabs id={id} />

      <main className="max-w-[1600px] mx-auto p-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Service Category Documents</h2>
              <p className="text-slate-500 text-sm mt-1">Review specific documents uploaded by the vendor for their active categories.</p>
            </div>
          </div>

          {!vendor.categoryDocuments || vendor.categoryDocuments.length === 0 ? (
            <div className="text-center py-20 px-4 border border-slate-100 border-dashed rounded-2xl">
              <h3 className="text-lg font-bold text-slate-700">No Category Documents</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">This vendor has not uploaded any specific documents for their service categories yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1">
              {Object.entries(
                vendor.categoryDocuments.reduce((acc, doc) => {
                  if (!acc[doc.category_slug]) acc[doc.category_slug] = [];
                  acc[doc.category_slug].push(doc);
                  return acc;
                }, {})
              ).map(([slug, docs]) => (
                <CategoryDocumentSection key={slug} title={`Category: ${slug.replace(/-/g, ' ')}`} docs={docs} onVerify={verifyCategoryDoc} onPreview={setPreviewImage} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Premium SaaS Ultra Lightbox Preview */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-12 cursor-zoom-out animate-in fade-in duration-300">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5">
              <Image src={previewImage} alt="Document Review" fill className="object-contain" priority sizes="100vw" />
            </div>
            <button className="absolute top-0 -right-2 sm:-right-8 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all border border-white/10 backdrop-blur-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryDocumentSection({ title, docs, onVerify, onPreview }) {
  if (!docs || docs.length === 0) return null;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.2em]">{title}</h4>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4"></div>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`}>
        {docs.map((doc, idx) => (
          <div key={idx} className="group relative bg-white/40 hover:bg-white backdrop-blur-xl border border-slate-200/60 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"> <StatusBadge status={doc.status} /> </div>
            <div className="relative h-48 w-full bg-slate-950 overflow-hidden cursor-zoom-in group" onClick={() => onPreview(doc.url)}>
              <Image src={doc.url} alt={doc.document_slug} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2.5 rounded-full transform scale-50 group-hover:scale-100 transition-transform duration-500 shadow-xl">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Document Title</span>
                  <span className="text-sm font-bold text-slate-800 mt-1 capitalize">{doc.document_slug.replace(/-/g, ' ')}</span>
                </div>
              </div>

              {doc.rejection_reason && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
                  <div className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-1">Rejection Reason</div>
                  <div className="text-xs text-rose-700 font-medium leading-relaxed">{doc.rejection_reason}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                {doc.status !== 'verified' && doc.status !== 'approved' && (
                  <button onClick={() => onVerify(doc._id, 'approved')} className="h-10 rounded-xl bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md shadow-slate-200">Approve</button>
                )}
                {doc.status !== 'rejected' && (
                  <button onClick={() => { const r = prompt('Reason?'); if (r) onVerify(doc._id, 'rejected', r); }} className="h-10 rounded-xl border border-slate-200 bg-white text-slate-600 text-[11px] font-bold uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all">Reject</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
