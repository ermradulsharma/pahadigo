'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import Image from 'next/image';
import VendorTabs from '@/components/admin/VendorTabs';
import { DetailItem, StatusBadge } from '@/components/admin/VendorUIFragments';
import { AlertTriangle } from 'lucide-react';
import PersonalTab from './tabs/PersonalTab';
import BusinessTab from './tabs/BusinessTab';
import PackageTab from './tabs/PackageTab';
import DocumentsTab from './tabs/DocumentsTab';

export default function VendorDetailsPage({ params }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [vendor, setVendor] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const token = getToken();
        const [res, pkgRes] = await Promise.all([
          fetch(`/api/admin/vendors/${id}`, {
            headers: { 'Authorization': 'Bearer ' + token }
          }),
          fetch(`/api/admin/vendors/${id}/packages`, {
            headers: { 'Authorization': 'Bearer ' + token }
          })
        ]);

        if (res.ok) {
          const data = await res.json();
          if (data.data?.vendor) setVendor(data.data.vendor);
        }
        if (pkgRes.ok) {
          const pkgData = await pkgRes.json();
          if (pkgData.success) {
            setPackages(pkgData.data.packages || []);
          }
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [id, refreshKey]);

  const verifyDocument = async (field, status, reason = '', index = null) => {
    try {
      const token = getToken();
      const body = { vendorId: id, documentField: field, status, reason, index };

      const res = await fetch('/api/admin/verify-document', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setRefreshKey(old => old + 1);
        setVerifying(null);
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      alert('An error occurred during verification');
    }
  };

  const triggerOCR = async (field, index = null) => {
    try {
      setVerifying(`${field}-${index !== null ? index : '0'}`);
      const token = getToken();
      const res = await fetch('/api/admin/trigger-ocr', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vendorId: id, documentField: field, index })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`OCR Success!\nName: ${data.data?.identity?.name || 'N/A'}\nID: ${data.data?.identity?.idNumber || 'N/A'}\nDOB: ${data.data?.identity?.dateOfBirth || 'N/A'}`);
        setRefreshKey(old => old + 1);
      } else {
        const err = await res.json();
        alert('OCR Failed: ' + (err.error || err.message || 'Unknown error'));
      }
    } catch (e) {
      alert('An error occurred during OCR');
    } finally {
      setVerifying(null);
    }
  };

  const toggleGlobalApproval = async (status) => {
    const confirmMsg = status === 'verified' ? 'Approve this vendor profile?' : 'Reject this vendor profile?';
    let rejectReason = '';
    if (status === 'rejected') {
      rejectReason = prompt('Enter rejection reason:');
      if (!rejectReason) return;
    } else if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const token = getToken();
      const res = await fetch('/api/admin/approve-vendor', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: id,
          status,
          rejectionReason: rejectReason
        })
      });

      if (res.ok) {
        setRefreshKey(old => old + 1);
      } else {
        alert('Failed to update profile status');
      }
    } catch (e) {
    }
  };

  const calculateKYCProgress = () => {
    if (!vendor?.documents) return 0;
    const mandatory = ['aadharCard', 'panCard', 'businessRegistration', 'gstRegistration'];
    const uploaded = mandatory.filter(key => {
      const doc = vendor.documents[key];
      if (Array.isArray(doc)) return doc.length > 0 && doc.some(d => d.url);
      return doc && doc.url;
    });
    return Math.round((uploaded.length / mandatory.length) * 100);
  };

  const calculateBankProgress = () => {
    if (!vendor?.bankDetails?.accountNumber) return 0;
    return 100; // Basic check for account number
  };

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-cyan-500 animate-spin-reverse opacity-70"></div>
        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
      </div>
      <p className="mt-4 text-xs font-mono tracking-[0.3em] uppercase text-indigo-400 animate-pulse">Decrypting Vendor Core...</p>
    </div>
  );

  if (!vendor) return (
    <div className="min-h-[80vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md bg-[#111116] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)] rounded-xl p-8">
        <h2 className="text-xl font-bold font-mono text-rose-500 mb-2 uppercase tracking-widest">Entity Not Found</h2>
        <button onClick={() => router.back()} className="mt-6 px-6 py-2.5 border border-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-mono hover:bg-white/5 transition uppercase tracking-widest">Terminate Process</button>
      </div>
    </div>
  );

  if (activeTab === 'personal') return <PersonalTab vendor={vendor} setVendor={setVendor} id={id} activeTab={activeTab} setActiveTab={setActiveTab} />;
  if (activeTab === 'business') return <BusinessTab vendor={vendor} setVendor={setVendor} id={id} activeTab={activeTab} setActiveTab={setActiveTab} />;
  if (activeTab === 'package') return <PackageTab vendor={vendor} packages={packages} setPackages={setPackages} id={id} activeTab={activeTab} setActiveTab={setActiveTab} />;
  if (activeTab === 'documents') return <DocumentsTab vendor={vendor} setVendor={setVendor} id={id} activeTab={activeTab} setActiveTab={setActiveTab} onRefresh={() => setRefreshKey(old => old + 1)} />;

  return (
    <div className="min-h-screen bg-transparent pb-24 relative">
      {/* Header Section */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-white/10 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 border border-transparent hover:border-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">
                <Link href="/admin/vendors" className="hover:text-cyan-400 transition-colors">Vendor DB</Link>
                <span className="text-slate-700">/</span>
                <span className="text-indigo-400">Review Matrix</span>
                {vendor.isApproved && (
                  <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 ml-2 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <CheckIcon className="w-3 h-3" />
                    Verified Sector
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                {vendor.businessName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!vendor.isApproved ? (
              <>
                <button onClick={() => toggleGlobalApproval('rejected')} className="px-5 py-2.5 text-xs font-mono font-bold tracking-widest uppercase text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">Reject Data</button>
                <button onClick={() => toggleGlobalApproval('verified')} className="px-6 py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold tracking-widest hover:bg-indigo-500/30 hover:border-indigo-400/50 hover:text-indigo-300 transition shadow-[0_0_15px_rgba(99,102,241,0.2)] uppercase">Validate & Approve Node</button>
              </>
            ) : (
              <button onClick={() => toggleGlobalApproval('rejected')} className="px-5 py-2.5 text-xs font-mono font-bold tracking-widest uppercase text-amber-500 border border-amber-500/20 hover:bg-amber-500/10 hover:text-amber-400 rounded-lg transition shadow-[0_0_10px_rgba(245,158,11,0.1)]">Revoke Access Clearance</button>
            )}
          </div>
        </div>
      </header>
      <VendorTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-[1600px] mx-auto p-8">
        <div className="grid grid-cols-12 gap-8">

          {/* Sidebar Overview */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Personal Details Card */}
            <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none"></div>
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
              <h3 className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-4 relative z-10 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Biological Operator
              </h3>
              <div className="space-y-6 relative z-10">
                <DetailItem label="Full Designation" value={vendor.user?.name || vendor.ownerName} mono />
                <div className="pt-4 border-t border-white/5">
                  <DetailItem label="Carrier Frequency" value={vendor.user?.phone} mono />
                </div>
                <div className="pt-4 border-t border-white/5">
                  <DetailItem label="Comm Link (Email)" value={vendor.user?.email || 'OFFLINE'} mono />
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Network Status</span>
                  <StatusBadge status={vendor.user?.status} />
                </div>
              </div>
            </div>

            {/* Quick Snapshot Card */}
            <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none"></div>
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
              <h3 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-[0.2em] mb-6 border-b border-white/10 pb-4 relative z-10 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                Corp Structure
              </h3>
              <div className="space-y-6 relative z-10">
                <div>
                  <DetailItem label="Corporate Entity ID" value={vendor.businessName} mono />
                  <Link href={`/admin/vendors/${id}/business`} className="text-cyan-400 text-[10px] font-mono font-bold mt-2 uppercase tracking-wide inline-flex items-center gap-1 hover:text-cyan-300 hover:drop-shadow-[0_0_5px_currentColor] transition-all">
                    Access Sector <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <DetailItem label="Primary Signatory" value={vendor.ownerName} mono />
                  <Link href={`/admin/vendors/${id}/personal`} className="text-indigo-400 text-[10px] font-mono font-bold mt-2 uppercase tracking-wide inline-flex items-center gap-1 hover:text-indigo-300 hover:drop-shadow-[0_0_5px_currentColor] transition-all">
                    Extract Bio-Data <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
                <div className="pt-6 border-t border-white/10">
                  <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-2">Primary Node Relay</label>
                  <div className="text-sm font-mono font-medium text-cyan-50">{vendor.businessNumber || 'UNDISCLOSED'}</div>
                </div>
              </div>
            </div>

            {/* Quick Stats or Status Placeholder */}
            <div className="bg-black/80 rounded-xl p-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none rounded-full"></div>
              <div className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Boot Sequence Progress
              </div>
              <div className="space-y-5 relative z-10">
                <ProgressItem label="Compliance Docs" percent={calculateKYCProgress()} color="bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                <ProgressItem label="Financial Uplink" percent={calculateBankProgress()} color="bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                <ProgressItem label="Profile Integration" percent={75} color="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </div>
            </div>
          </div>

          {/* Main Compliance Panel */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-mono font-bold text-white tracking-widest uppercase flex items-center gap-3">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    Compliance Matrix & KYC
                  </h2>
                  <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-2 ml-8">Review Govt Issues IDs and Business Certificates.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                <DocumentSection title="Aadhar Card" docs={vendor.documents?.aadharCard} field="aadharCard" onVerify={verifyDocument} onOCR={triggerOCR} verifying={verifying} onPreview={setPreviewImage} ocr priority />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DocumentSection title="PAN Card" docs={vendor.documents?.panCard} field="panCard" onVerify={verifyDocument} onOCR={triggerOCR} verifying={verifying} onPreview={setPreviewImage} ocr />
                  <DocumentSection title="Business Registration" docs={vendor.documents?.businessRegistration} field="businessRegistration" onVerify={verifyDocument} onPreview={setPreviewImage} compact />
                  <DocumentSection title="GST Certificate" docs={vendor.documents?.gstRegistration} field="gstRegistration" onVerify={verifyDocument} onPreview={setPreviewImage} compact />
                  <DocumentSection title="Travel Agent Permit" docs={vendor.documents?.travelAgentPermit} field="travelAgentPermit" onVerify={verifyDocument} onPreview={setPreviewImage} />
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Premium SaaS Ultra Lightbox Preview */}
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-12 cursor-zoom-out animate-in fade-in duration-300">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Image Container */}
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5">
              <Image src={previewImage} alt="Document Review" fill className="object-contain" priority sizes="100vw" />
            </div>

            {/* Floating Close Button */}
            <button className="absolute top-0 -right-2 sm:-right-8 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all border border-white/10 backdrop-blur-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Internal UI Fragments ---
function ProgressItem({ label, percent, color }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono tracking-widest uppercase mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{percent}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function DocumentSection({ title, docs: rawDocs, field, onVerify, onOCR, verifying, onPreview, compact, ocr, priority }) {
  const docs = (Array.isArray(rawDocs) ? rawDocs : (rawDocs ? [rawDocs] : [])).filter(doc => doc && doc.url);
  if (docs.length === 0) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[10px] font-bold font-mono text-cyan-500 uppercase tracking-[0.3em] drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">{title}</h4>
        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent ml-4"></div>
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-${docs.length} lg:grid-cols-${docs.length} gap-5`}>
        {docs.map((doc, idx) => (
          <div key={idx} className="group relative bg-[#111116] border border-white/10 rounded-xl overflow-hidden transition-all duration-500 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none transition-opacity group-hover:opacity-20 z-0"></div>

            {/* Status Float */}
            <div className="absolute top-3 right-3 z-20"> <StatusBadge status={doc.status} /> </div>

            {/* SaaS Ultra Image Preview */}
            <div className="relative h-48 w-full bg-black overflow-hidden cursor-zoom-in group-hover:block z-10" onClick={() => onPreview(doc.url)}>
              <Image src={doc.url} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1 opacity-80 group-hover:opacity-100 mix-blend-screen" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={priority && idx === 0} />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-70"></div>

              {/* Glassmorphism Zoom Indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/5 backdrop-blur-md border border-white/20 p-3 rounded-full transform scale-50 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <svg className="w-6 h-6 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                </div>
              </div>
            </div>

            {/* Card Footer / Actions */}
            <div className="p-5 flex-1 flex flex-col relative z-20 bg-black/40 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Hash Reference</span>
                  <span className="text-[11px] font-mono text-cyan-100/70 tracking-widest pl-1 border-l-2 border-indigo-500/50">#{doc.url?.split('/').pop().slice(-8) || 'N/A'}</span>
                </div>
                {doc.status !== 'verified' && doc.status !== 'approved' && ocr && (
                  <button disabled={verifying === `${field}-${idx}`} onClick={() => onOCR(field, idx)} className="h-8 px-3.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[9px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-indigo-500/20 hover:text-indigo-300 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all flex items-center gap-2">
                    {verifying === `${field}-${idx}` ? (
                      <div className="w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                    )}
                    {verifying === `${field}-${idx}` ? 'SCANNING' : 'RUN OCR'}
                  </button>
                )}
              </div>

              {doc.ocrData?.identifiedId && (
                <div className="bg-black/80 rounded-lg p-3 border border-emerald-500/20 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">Identified Identity</span>
                    <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 drop-shadow-[0_0_3px_rgba(16,185,129,0.8)]">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> MATCH LINKED
                    </span>
                  </div>
                  <div className="text-[12px] font-bold text-cyan-50 font-mono tracking-widest">{doc.ocrData.identifiedId}</div>
                </div>
              )}

              {doc.reason && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 mb-4 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
                  <div className="text-[8px] font-mono font-bold text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> System Fault Directive</div>
                  <div className="text-xs text-rose-300 font-mono leading-relaxed">{doc.reason}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 mt-auto">
                {doc.status !== 'verified' && doc.status !== 'approved' && (
                  <button onClick={() => onVerify(field, 'verified', null, idx)} className="h-9 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-emerald-500/20 hover:text-emerald-300 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]">ACCEPT</button>
                )}
                {doc.status !== 'rejected' && (
                  <button onClick={() => { const r = prompt('Directive fault reason?'); if (r) onVerify(field, 'rejected', r, idx); }} className="h-9 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-rose-500/20 hover:text-rose-300 transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)]">DENY</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Icons ---
const CheckIcon = ({ className }) => <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;

