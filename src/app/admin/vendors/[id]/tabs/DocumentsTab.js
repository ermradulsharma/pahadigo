'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/core/Helpers/authUtils';
import Image from 'next/image';
import VendorTabs from '@/components/admin/VendorTabs';
import { StatusBadge, MainPanelCard, VendorHeader } from '@/components/admin/VendorUIFragments';
import { FileText, ShieldCheck, Eye, Check as CheckIcon, X } from 'lucide-react';

export default function DocumentsTab({ vendor, setVendor, id, activeTab, setActiveTab, onRefresh }) {
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState(null);



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
        if (onRefresh) onRefresh();
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      alert('An error occurred during verification');
    }
  };



  return (
    <div className="min-h-screen bg-transparent pb-24 relative">
      <VendorHeader vendor={vendor} onBack={() => router.back()} id={id} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-[1600px] mx-auto p-8 relative z-10">
        <MainPanelCard title="Certified Node Data" icon={ShieldCheck} colorClass="text-indigo-400">
          <div className="relative z-10">
            {!vendor.categoryDocuments || vendor.categoryDocuments.length === 0 ? (
              <div className="text-center py-20 px-4 border border-white/5 border-dashed rounded-xl bg-black/40">
                <h3 className="text-lg font-bold font-mono text-slate-400 uppercase tracking-widest">Null Reference</h3>
                <p className="text-slate-600 mt-2 max-w-sm mx-auto text-xs font-mono">This node has not uploaded encrypted payload for verification.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-12">
                {Object.entries(
                  vendor.categoryDocuments.reduce((acc, doc) => {
                    if (!acc[doc.category_slug]) acc[doc.category_slug] = [];
                    acc[doc.category_slug].push(doc);
                    return acc;
                  }, {})
                ).map(([slug, docs]) => (
                  <CategoryDocumentSection key={slug} title={`Cluster: ${slug.replace(/-/g, ' ')}`} docs={docs} onVerify={verifyCategoryDoc} onPreview={setPreviewImage} />
                ))}
              </div>
            )}
          </div>
        </MainPanelCard>
      </main>

      {/* Premium SaaS Ultra Lightbox Preview */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-12 cursor-zoom-out animate-in fade-in duration-300">
          <div className="relative w-full h-full flex flex-col items-center justify-center max-w-5xl mx-auto">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(34,211,238,0.2)] border border-white/10 bg-[#0a0a0f]">
              <Image src={previewImage?.replace(/\.pdf$/i, '.jpg')} alt="Document Review" fill className="object-contain" priority sizes="100vw" />
            </div>
            <button className="absolute -top-4 -right-4 bg-black/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 p-3 rounded-full transition-all border border-white/10 hover:border-rose-500/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[12px] font-mono font-bold text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]"></span>
          {title}
        </h4>
        <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/30 to-transparent ml-6"></div>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`}>
        {docs.map((doc, idx) => (
          <div key={idx} className="group relative bg-black/40 hover:bg-[#0a0a0f] backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden transition-all duration-500 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] hover:border-cyan-500/30 flex flex-col">
            <div className="absolute top-3 right-3 z-10 scale-90 origin-top-right transition-transform duration-300"> <StatusBadge status={doc.status} /> </div>
            <div className="relative h-48 w-full bg-[#050505] overflow-hidden cursor-zoom-in group-hover:opacity-90 transition-opacity" onClick={() => onPreview(doc.url)}>
              <Image src={doc.url?.replace(/\.pdf$/i, '.jpg')} alt={doc.document_slug} fill className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-black/50 backdrop-blur-md border border-cyan-500/30 p-2.5 rounded-xl transform scale-50 group-hover:scale-100 transition-all duration-500 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col relative z-10 border-t border-white/5">
              <div className="flex flex-col mb-4">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Vector Identity</span>
                <span className="text-[13px] font-mono font-bold text-cyan-50 capitalize truncate">{doc.document_slug.replace(/-/g, ' ')}</span>
              </div>

              {doc.rejection_reason && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 mb-4 shadow-[inset_0_0_10px_rgba(244,63,94,0.05)]">
                  <div className="text-[9px] font-mono font-bold text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Denial Log
                  </div>
                  <div className="text-[11px] font-mono text-rose-400 font-medium leading-relaxed">{doc.rejection_reason}</div>
                </div>
              )}

              <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                {doc.status !== 'verified' && doc.status !== 'approved' && (
                  <button onClick={() => onVerify(doc._id, 'approved')} className="h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Verify
                  </button>
                )}
                {doc.status !== 'rejected' && (
                  <button onClick={() => { const r = prompt('Reason for denial?'); if (r) onVerify(doc._id, 'rejected', r); }} className="h-10 rounded-lg bg-black/50 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-rose-500/10 hover:border-rose-400/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all flex items-center justify-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Deny
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
