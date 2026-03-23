'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import VendorTabs from '@/components/admin/VendorTabs';
import { DetailItem, StatusBadge } from '@/components/admin/VendorUIFragments';

export default function BusinessTab({ vendor, setVendor, id, activeTab, setActiveTab }) {
    const router = useRouter();
    const [showMapModal, setShowMapModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        ownerName: '',
        personalNumber: '',
        personalPanCard: '',
        personalAbout: '',
        businessName: '',
        businessNumber: '',
        gstNumber: '',
        businessRegistration: '',
        businessAbout: '',
        address: {
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            country: 'India',
            pincode: ''
        },
        bankDetails: {
            bankName: '',
            accountNumber: '',
            ifscCode: '',
            accountHolderName: ''
        }
    });

    useEffect(() => {
        if (vendor) {
            setFormData({
                ownerName: vendor.ownerName || '',
                personalNumber: vendor.personalNumber || '',
                personalPanCard: vendor.personalPanCard || '',
                personalAbout: vendor.personalAbout || '',
                businessName: vendor.businessName || '',
                businessNumber: vendor.businessNumber || '',
                gstNumber: vendor.gstNumber || '',
                businessRegistration: vendor.businessRegistration || '',
                businessAbout: vendor.businessAbout || '',
                address: {
                    addressLine1: vendor.address?.addressLine1 || '',
                    addressLine2: vendor.address?.addressLine2 || '',
                    city: vendor.address?.city || '',
                    state: vendor.address?.state || '',
                    country: vendor.address?.country || 'India',
                    pincode: vendor.address?.pincode || ''
                },
                bankDetails: {
                    bankName: vendor.bankDetails?.bankName || '',
                    accountNumber: vendor.bankDetails?.accountNumber || '',
                    ifscCode: vendor.bankDetails?.ifscCode || '',
                    accountHolderName: vendor.bankDetails?.accountHolderName || ''
                }
            });
        }
    }, [vendor]);

    const performAction = async (actionData) => {
        setSaving(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/vendors/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(actionData)
            });
            if (res.ok) {
                const data = await res.json();
                setVendor(data.data.vendor);
            } else {
                alert("Action failed. Please check permissions.");
            }
        } catch (e) {
            alert("Error communicating with server.");
        } finally {
            setSaving(false);
        }
    };

    const verifyDocument = async (documentField, status, reason = null, index = null) => {
        setSaving(true);
        try {
            const token = getToken();
            const res = await fetch('/api/admin/verify-document', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ vendorId: id, documentField, status, reason, index })
            });
            if (res.ok) {
                // Refresh vendor data
                const refreshRes = await fetch(`/api/admin/vendors`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const refreshData = await refreshRes.json();
                const updated = refreshData.data?.vendors?.find(v => v._id === id);
                if (updated) setVendor(updated);
            } else {
                alert("Verification failed.");
            }
        } catch (e) {
            alert("Error updating document status.");
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/vendors/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const data = await res.json();
                setVendor(data.data.vendor);
                setIsEditing(false);
            } else {
                alert("Failed to update profile");
            }
        } catch (e) {
            alert("Error updating profile");
        } finally {
            setSaving(false);
        }
    };



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
                                <span className="text-indigo-400">Corp Structure</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">{vendor.businessName}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold tracking-widest hover:bg-indigo-500/30 hover:border-indigo-400/50 hover:text-indigo-300 transition shadow-[0_0_15px_rgba(99,102,241,0.2)] uppercase">
                                Modify Matrix
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-xs font-mono font-bold tracking-widest uppercase text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition border border-transparent hover:border-white/10">
                                    Abort
                                </button>
                                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold tracking-widest hover:bg-emerald-500/30 hover:border-emerald-400/50 hover:text-emerald-300 transition shadow-[0_0_15px_rgba(16,185,129,0.2)] uppercase disabled:opacity-50">
                                    {saving ? 'Transmitting...' : 'Commit Changes'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <VendorTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="max-w-[1600px] mx-auto p-8 relative z-10">
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* Vendor Profile Info */}
                        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none"></div>
                            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                            <h3 className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4 relative z-10 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Bio-Operator Node Data
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Operator Designation</label>
                                            <input type="text" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Direct Comm Link</label>
                                            <input type="text" value={formData.personalNumber} onChange={(e) => setFormData({ ...formData, personalNumber: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Tax Identifier (PAN)</label>
                                            <input type="text" value={formData.personalPanCard} onChange={(e) => setFormData({ ...formData, personalPanCard: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 uppercase" />
                                        </div>
                                        <div className="col-span-2 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Memory Log / Bio</label>
                                            <textarea rows={3} value={formData.personalAbout} onChange={(e) => setFormData({ ...formData, personalAbout: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 leading-relaxed" placeholder="Compile memory sequence..." />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DetailItem label="Operator Designation" value={vendor.ownerName} mono />
                                        <DetailItem label="Direct Comm Link" value={vendor.personalNumber} mono />
                                        <DetailItem label="Tax Identifier (PAN)" value={vendor.personalPanCard} mono />
                                        <div className="col-span-2 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Memory Logs Overview</label>
                                            <p className="text-[12px] text-cyan-50/80 font-mono leading-relaxed">{vendor.personalAbout || 'Core logs returning empty sequence.'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Entity Details */}
                        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none"></div>
                            <h3 className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4 relative z-10 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                Corporate Entity Architecture
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Entity Name</label>
                                            <input type="text" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Corp Comm Channel</label>
                                            <input type="text" value={formData.businessNumber} onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Gov Identifier (GST)</label>
                                            <input type="text" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 uppercase" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Registration Hash</label>
                                            <input type="text" value={formData.businessRegistration} onChange={(e) => setFormData({ ...formData, businessRegistration: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 uppercase" />
                                        </div>
                                        <div className="col-span-2 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Entity Blueprint / Log</label>
                                            <textarea rows={4} value={formData.businessAbout} onChange={(e) => setFormData({ ...formData, businessAbout: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 leading-relaxed" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DetailItem label="Entity Legal Name" value={vendor.businessName} mono />
                                        <DetailItem label="Corp Comm Channel" value={vendor.businessNumber} mono />
                                        <DetailItem label="Gov Identifier (GST)" value={vendor.gstNumber} mono />
                                        <DetailItem label="Registration Hash" value={vendor.businessRegistration} mono />
                                        <div className="col-span-2 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Entity Blueprint</label>
                                            <p className="text-[12px] text-cyan-50/80 font-mono leading-relaxed">
                                                {vendor.businessAbout || 'Blueprint not available.'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* HQ Location */}
                        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none"></div>
                            <h3 className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4 relative z-10 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Corporate Operations Base
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Address Vector 1</label>
                                            <input type="text" value={formData.address.addressLine1} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, addressLine1: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Address Vector 2</label>
                                            <input type="text" value={formData.address.addressLine2} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, addressLine2: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">City Matrix</label>
                                            <input type="text" value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Regional State</label>
                                            <input type="text" value={formData.address.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Global Region</label>
                                            <input type="text" value={formData.address.country} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Zip/Pincode</label>
                                            <input type="text" value={formData.address.pincode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-[12px] text-cyan-50/80 font-mono leading-relaxed pb-4 border-b border-white/5">
                                            {[
                                                vendor.address?.addressLine1,
                                                vendor.address?.addressLine2,
                                                vendor.address?.city,
                                                vendor.address?.state,
                                                vendor.address?.country,
                                                vendor.address?.pincode
                                            ].filter(Boolean).join(', ') || 'Awaiting structural coordinate data.'}
                                        </p>
                                        {(vendor.address?.latitude && vendor.address?.longitude) && (
                                            <div className="flex justify-end pt-2">
                                                <button onClick={() => setShowMapModal(true)} className="px-5 py-2.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em] rounded-lg border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    Initiate Coordinate Scan
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Financial Settlement */}
                        <div className="bg-black/90 rounded-xl border border-emerald-500/20 p-8 shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none rounded-full"></div>
                            <h3 className="text-[10px] font-mono font-bold text-emerald-500 uppercase tracking-[0.2em] mb-6 border-b border-emerald-500/20 pb-4 relative z-10 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" /></svg>
                                Finance & Ledger Node
                            </h3>
                            <div className="relative z-10">
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-[0.2em]">Depository Inst.</label>
                                        <input type="text" value={formData.bankDetails.bankName} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-emerald-500/20 rounded-lg focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-xs font-mono text-emerald-50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-[0.2em]">Ledger UID</label>
                                        <input type="text" value={formData.bankDetails.accountNumber} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-emerald-500/20 rounded-lg focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-xs font-mono text-emerald-50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-[0.2em]">Routing Token (IFSC)</label>
                                        <input type="text" value={formData.bankDetails.ifscCode} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, ifscCode: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-emerald-500/20 rounded-lg focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-xs font-mono text-emerald-50 uppercase" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-[0.2em]">Ledger Holder ID</label>
                                        <input type="text" value={formData.bankDetails.accountHolderName} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-emerald-500/20 rounded-lg focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-xs font-mono text-emerald-50" />
                                    </div>
                                </div>
                            ) : vendor.bankDetails?.accountNumber ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <DetailItem label="Ledger UID (Acc No)" value={vendor.bankDetails.accountNumber} mono />
                                    <DetailItem label="Routing Token (IFSC)" value={vendor.bankDetails.ifscCode} mono />
                                    <DetailItem label="Depository Inst. (Bank)" value={vendor.bankDetails.bankName} mono />
                                    <DetailItem label="Ledger Holder ID" value={vendor.bankDetails.accountHolderName} mono />
                                    <div className="col-span-2 pt-4 flex items-center justify-between border-t border-emerald-500/20">
                                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-[0.2em]">Ledger Validation Status</span>
                                        <StatusBadge status={vendor.bankDetails.status} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[12px] text-emerald-500/50 font-mono italic py-4">Financial protocols pending initiation.</p>
                            )}
                            </div>
                        </div>

                        {/* KYC & Admin Controls */}
                        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
                            <h3 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-[0.2em] mb-6 border-b border-indigo-500/20 pb-4 relative z-10 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                Clearance & Authorization Protocol
                            </h3>

                            <div className="space-y-6 relative z-10">
                                {/* Documents Section */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">Cryptographic Key Review</p>

                                    {[
                                        { field: 'aadharCard', label: 'Identity Proof (Aadhar)', value: vendor.documents?.aadharCard?.[0] || vendor.documents?.aadharCard },
                                        { field: 'panCard', label: 'Tax Profile (PAN)', value: vendor.documents?.panCard },
                                        { field: 'businessRegistration', label: 'Corp Blueprint (Reg)', value: vendor.documents?.businessRegistration },
                                        { field: 'gstRegistration', label: 'Tax Node (GST)', value: vendor.documents?.gstRegistration }
                                    ].map(doc => (
                                        <div key={doc.field} className="p-4 bg-black/40 rounded-xl border border-white/5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-mono font-bold text-cyan-50 uppercase tracking-widest">{doc.label}</p>
                                                {doc.value?.url ? (
                                                    <div className="flex items-center gap-4">
                                                        <a href={doc.value.url} target="_blank" className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline uppercase tracking-widest flex items-center gap-1 transition-colors">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            Ext. Access
                                                        </a>
                                                        <StatusBadge status={doc.value.status} />
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest italic">Awaiting Payload</span>
                                                )}
                                            </div>

                                            {doc.value?.url && doc.value.status === 'pending' && (
                                                <div className="flex gap-2 isolate">
                                                    <button onClick={() => verifyDocument(doc.field, 'verified')} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase tracking-widest rounded hover:bg-emerald-500/30 hover:border-emerald-400/50 transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)]">Authenticate</button>
                                                    <button onClick={() => {
                                                        const reason = prompt("Enter denial reason:");
                                                        if (reason) verifyDocument(doc.field, 'rejected', reason);
                                                    }} className="px-3 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono font-bold uppercase tracking-widest rounded hover:bg-rose-500/30 hover:border-rose-400/50 transition-all shadow-[0_0_10px_rgba(244,63,94,0.15)]">Deny Request</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Final Approval Section */}
                                <div className="pt-6 border-t border-white/5 mt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-indigo-500/5 rounded-xl border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.05)] gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-widest">Global Corp Authorization</p>
                                            <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">State: {vendor.isApproved ? <span className="text-emerald-400">Authorized Codec</span> : <span className="text-amber-500">Operation Suspended</span>}</p>
                                        </div>
                                        <button
                                            onClick={() => performAction({ isApproved: !vendor.isApproved })}
                                            disabled={saving}
                                            className={`px-5 py-2.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${vendor.isApproved ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 hover:border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}
                                        >
                                            {vendor.isApproved ? 'Revoke Rights' : 'Grant Clearances'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Map Modal */}
            {showMapModal && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none"></div>
                    <div className="relative w-full max-w-4xl h-[70vh] bg-[#0a0a0f] rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.15)] border border-white/10 overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-300 z-10">
                        <button onClick={() => setShowMapModal(false)} className="absolute top-4 right-4 z-50 p-2 bg-black/80 hover:bg-white/10 text-slate-400 hover:text-rose-400 border border-white/10 backdrop-blur-md rounded-lg transition-all" title="Terminate view">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="flex-1 w-full bg-black relative p-1">
                            <iframe className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] z-10 rounded-lg filter invert-[90%] hue-rotate-180 contrast-125 saturate-50" src={`https://maps.google.com/maps?q=${vendor.address?.latitude},${vendor.address?.longitude}&z=15&output=embed`} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
