'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import Image from 'next/image';
import VendorTabs from '@/components/admin/VendorTabs';
import { DetailItem, StatusBadge } from '@/components/admin/VendorUIFragments';

export default function VendorDetailsPage({ params }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const router = useRouter();
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(null);
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-[13px] font-medium text-slate-500">Loading Vendor Overiew</p>
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
                                <span className="text-slate-600">Review</span>
                                {vendor.isApproved && (
                                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 ml-2">
                                        <CheckIcon className="w-3 h-3" />
                                        Verified
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 leading-none">{vendor.businessName}</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!vendor.isApproved ? (
                            <>
                                <button onClick={() => toggleGlobalApproval('rejected')} className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition border border-slate-200">Reject Application</button>
                                <button onClick={() => toggleGlobalApproval('verified')} className="px-8 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm active:scale-95">Verify & Approve</button>
                            </>
                        ) : (
                            <button onClick={() => toggleGlobalApproval('rejected')} className="px-4 py-2 text-xs font-bold text-rose-600 border border-rose-100 hover:bg-rose-50 rounded-lg transition">Revoke Approval</button>
                        )}
                    </div>
                </div>
            </header>
            <VendorTabs id={id} />
            <main className="max-w-[1600px] mx-auto p-8">
                <div className="grid grid-cols-12 gap-8">

                    {/* Sidebar Overview */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        {/* Personal Details Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Personal Details</h3>
                            <div className="space-y-6">
                                <DetailItem label="Full Name" value={vendor.user?.name || vendor.ownerName} />
                                <div className="pt-4 border-t border-slate-50">
                                    <DetailItem label="Mobile Number" value={vendor.user?.phone} />
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <DetailItem label="Email Address" value={vendor.user?.email || 'No email associated'} />
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Status</span>
                                    <StatusBadge status={vendor.user?.status} />
                                </div>
                            </div>
                        </div>

                        {/* Quick Snapshot Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Quick Snapshot</h3>
                            <div className="space-y-6">
                                <div>
                                    <DetailItem label="Business Entity" value={vendor.businessName} />
                                    <Link href={`/admin/vendors/${id}/business`} className="text-indigo-600 text-[10px] font-bold mt-1 inline-block hover:underline">View Business Profile</Link>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <DetailItem label="Owner/Signatory" value={vendor.ownerName} />
                                    <Link href={`/admin/vendors/${id}/personal`} className="text-indigo-600 text-[10px] font-bold mt-1 inline-block hover:underline">View Personal Profile</Link>
                                </div>
                                <div className="pt-6 border-t border-slate-100">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Business Contact</label>
                                    <div className="text-sm font-bold text-slate-700">{vendor.businessNumber || 'Not provided'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats or Status Placeholder */}
                        <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/10">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Application Progress</div>
                            <div className="space-y-4">
                                <ProgressItem label="KYC Documents" percent={calculateKYCProgress()} color="bg-emerald-500" />
                                <ProgressItem label="Bank Details" percent={calculateBankProgress()} color="bg-emerald-500" />
                                <ProgressItem label="Profile Setup" percent={75} color="bg-indigo-500" />
                            </div>
                        </div>
                    </div>

                    {/* Main Compliance Panel */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Compliance & KYC</h2>
                                    <p className="text-slate-500 text-sm">Review government-issued IDs and business registration documents.</p>
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
            <div className="flex justify-between text-[10px] font-bold mb-1">
                <span className="text-slate-400">{label}</span>
                <span className="text-slate-200">{percent}%</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
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
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h4>
                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent ml-4"></div>
            </div>
            <div className={`grid grid-cols-1 sm:grid-cols-${docs.length} lg:grid-cols-${docs.length} gap-5`}>
                {docs.map((doc, idx) => (
                    <div key={idx} className="group relative bg-white/40 hover:bg-white backdrop-blur-xl border border-slate-200/60 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                        {/* Status Float */}
                        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"> <StatusBadge status={doc.status} /> </div>

                        {/* SaaS Ultra Image Preview */}
                        <div className="relative h-44 w-full bg-slate-950 overflow-hidden cursor-zoom-in group" onClick={() => onPreview(doc.url)}>
                            <Image src={doc.url} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={priority && idx === 0} />

                            {/* Glassmorphism Zoom Indicator */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2.5 rounded-full transform scale-50 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer / Actions */}
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Reference</span>
                                    <span className="text-[11px] font-mono text-slate-600 mt-1">#{doc.url?.split('/').pop().slice(-8) || 'N/A'}</span>
                                </div>
                                {doc.status !== 'verified' && ocr && (
                                    <button disabled={verifying === `${field}-${idx}`} onClick={() => onOCR(field, idx)} className="h-8 px-3 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                                        {verifying === `${field}-${idx}` ? (
                                            <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                                        )}
                                        {verifying === `${field}-${idx}` ? 'SCANNING' : 'SCAN OCR'}
                                    </button>
                                )}
                            </div>

                            {doc.ocrData?.identifiedId && (
                                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Identified Identity</span>
                                        <span className="text-[8px] font-bold text-emerald-500 uppercase flex items-center gap-1">
                                            <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> MATCH
                                        </span>
                                    </div>
                                    <div className="text-[13px] font-bold text-white font-mono tracking-wider">{doc.ocrData.identifiedId}</div>
                                </div>
                            )}

                            {doc.reason && (
                                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                                    <div className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mb-1">Rejection Reason</div>
                                    <div className="text-xs text-rose-700 font-medium leading-relaxed">{doc.reason}</div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                {doc.status !== 'verified' && (
                                    <button onClick={() => onVerify(field, 'verified', null, idx)} className="h-10 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200">Approve</button>
                                )}
                                {doc.status !== 'rejected' && (
                                    <button onClick={() => { const r = prompt('Reason?'); if (r) onVerify(field, 'rejected', r, idx); }} className="h-10 rounded-xl border border-slate-200 bg-white text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all">Reject</button>
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
