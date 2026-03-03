'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import VendorTabs from '@/components/admin/VendorTabs';
import { DetailItem, StatusBadge } from '@/components/admin/VendorUIFragments';

export default function BusinessProfilePage({ params }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const router = useRouter();
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
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
                    if (found) {
                        setVendor(found);
                        setFormData({
                            ownerName: found.ownerName || '',
                            personalNumber: found.personalNumber || '',
                            personalPanCard: found.personalPanCard || '',
                            personalAbout: found.personalAbout || '',
                            businessName: found.businessName || '',
                            businessNumber: found.businessNumber || '',
                            gstNumber: found.gstNumber || '',
                            businessRegistration: found.businessRegistration || '',
                            businessAbout: found.businessAbout || '',
                            address: {
                                addressLine1: found.address?.addressLine1 || '',
                                addressLine2: found.address?.addressLine2 || '',
                                city: found.address?.city || '',
                                state: found.address?.state || '',
                                country: found.address?.country || 'India',
                                pincode: found.address?.pincode || ''
                            },
                            bankDetails: {
                                bankName: found.bankDetails?.bankName || '',
                                accountNumber: found.bankDetails?.accountNumber || '',
                                ifscCode: found.bankDetails?.ifscCode || '',
                                accountHolderName: found.bankDetails?.accountHolderName || ''
                            }
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to fetch vendor:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchVendor();
    }, [id]);

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

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-[13px] font-medium text-slate-500">Loading Business Profile</p>
        </div>
    );

    if (!vendor) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
            <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Vendor not found</h2>
                <p className="text-slate-500 mb-6">The requested vendor record could not be retrieved from the database.</p>
                <button onClick={() => router.back()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-sm hover:bg-indigo-700 transition active:scale-95">Go Back</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24">
            {/* Header Section */}
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                <Link href="/admin/vendors" className="hover:text-indigo-600 transition-colors">Vendors</Link>
                                <span>/</span>
                                <span className="text-slate-600">Business Profile</span>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 leading-none">{vendor.businessName}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition shadow-sm">Edit Business Info</button>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <VendorTabs id={id} />

            <main className="max-w-[1600px] mx-auto p-8">
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* Vendor Profile Info */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Vendor Info (Stored In Vendor Model)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Owner Name</label>
                                            <input type="text" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Contact</label>
                                            <input type="text" value={formData.personalNumber} onChange={(e) => setFormData({ ...formData, personalNumber: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal PAN</label>
                                            <input type="text" value={formData.personalPanCard} onChange={(e) => setFormData({ ...formData, personalPanCard: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold uppercase" />
                                        </div>
                                        <div className="col-span-2 pt-4 border-t border-slate-50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Personal About</label>
                                            <textarea rows={3} value={formData.personalAbout} onChange={(e) => setFormData({ ...formData, personalAbout: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DetailItem label="Owner Name" value={vendor.ownerName} />
                                        <DetailItem label="Personal Number" value={vendor.personalNumber} />
                                        <DetailItem label="Personal PAN" value={vendor.personalPanCard} mono />
                                        <div className="col-span-2 pt-4 border-t border-slate-50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Personal About</label>
                                            <p className="text-[14px] text-slate-600 leading-relaxed">{vendor.personalAbout || 'No description provided.'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Entity Details */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Business Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Name</label>
                                            <input type="text" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Contact</label>
                                            <input type="text" value={formData.businessNumber} onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GST Number</label>
                                            <input type="text" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold uppercase" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration No.</label>
                                            <input type="text" value={formData.businessRegistration} onChange={(e) => setFormData({ ...formData, businessRegistration: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold uppercase" />
                                        </div>
                                        <div className="col-span-2 pt-4 border-t border-slate-50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Business Bio</label>
                                            <textarea rows={4} value={formData.businessAbout} onChange={(e) => setFormData({ ...formData, businessAbout: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DetailItem label="Legal Business Name" value={vendor.businessName} />
                                        <DetailItem label="Business Contact" value={vendor.businessNumber} />
                                        <DetailItem label="GST Number" value={vendor.gstNumber} mono />
                                        <DetailItem label="Registration No." value={vendor.businessRegistration} mono />
                                        <div className="col-span-2 pt-4 border-t border-slate-50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Business Bio</label>
                                            <p className="text-[14px] text-slate-600 leading-relaxed">
                                                {vendor.businessAbout || 'No description provided.'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* HQ Location */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Corporate Office</h3>
                            <div className="space-y-4">
                                {isEditing ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address Line 1</label>
                                            <input type="text" value={formData.address.addressLine1} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, addressLine1: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address Line 2</label>
                                            <input type="text" value={formData.address.addressLine2} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, addressLine2: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">City</label>
                                            <input type="text" value={formData.address.city} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">State</label>
                                            <input type="text" value={formData.address.state} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                                            <input type="text" value={formData.address.country} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pincode</label>
                                            <input type="text" value={formData.address.pincode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-[15px] font-semibold text-slate-700 leading-relaxed">
                                            {[
                                                vendor.address?.addressLine1,
                                                vendor.address?.addressLine2,
                                                vendor.address?.city,
                                                vendor.address?.state,
                                                vendor.address?.country,
                                                vendor.address?.pincode
                                            ].filter(Boolean).join(', ')}
                                        </p>
                                        {(vendor.address?.latitude && vendor.address?.longitude) && (
                                            <button onClick={() => setShowMapModal(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                Pinpoint on Map
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Financial Settlement */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Financial Settlement</h3>
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Name</label>
                                        <input type="text" value={formData.bankDetails.bankName} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Number</label>
                                        <input type="text" value={formData.bankDetails.accountNumber} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IFSC Code</label>
                                        <input type="text" value={formData.bankDetails.ifscCode} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, ifscCode: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm uppercase" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Holder</label>
                                        <input type="text" value={formData.bankDetails.accountHolderName} onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                    </div>
                                </div>
                            ) : vendor.bankDetails?.accountNumber ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <DetailItem label="Account Number" value={vendor.bankDetails.accountNumber} mono />
                                    <DetailItem label="IFSC Code" value={vendor.bankDetails.ifscCode} mono />
                                    <DetailItem label="Bank Name" value={vendor.bankDetails.bankName} />
                                    <DetailItem label="Account Holder" value={vendor.bankDetails.accountHolderName} />
                                    <div className="col-span-2 pt-4 flex items-center justify-between border-t border-slate-50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Status</span>
                                        <StatusBadge status={vendor.bankDetails.status} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic py-4">Financial details pending submission.</p>
                            )}
                        </div>

                        {/* KYC & Admin Controls */}
                        <div className="bg-white rounded-2xl border border-indigo-100 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">KYC & Business Approval</h3>

                            <div className="space-y-6">
                                {/* Documents Section */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Individual Document Verification</p>

                                    {[
                                        { field: 'aadharCard', label: 'Aadhar Card', value: vendor.documents?.aadharCard?.[0] || vendor.documents?.aadharCard },
                                        { field: 'panCard', label: 'PAN Card', value: vendor.documents?.panCard },
                                        { field: 'businessRegistration', label: 'Business Reg.', value: vendor.documents?.businessRegistration },
                                        { field: 'gstRegistration', label: 'GST Reg.', value: vendor.documents?.gstRegistration }
                                    ].map(doc => (
                                        <div key={doc.field} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-slate-700">{doc.label}</p>
                                                {doc.value?.url ? (
                                                    <div className="flex items-center gap-2">
                                                        <a href={doc.value.url} target="_blank" className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-tight">View Doc</a>
                                                        <StatusBadge status={doc.value.status} />
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Not Uploaded</span>
                                                )}
                                            </div>

                                            {doc.value?.url && doc.value.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => verifyDocument(doc.field, 'verified')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-lg hover:bg-emerald-100 transition-colors">Verify</button>
                                                    <button onClick={() => {
                                                        const reason = prompt("Enter rejection reason:");
                                                        if (reason) verifyDocument(doc.field, 'rejected', reason);
                                                    }} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-bold uppercase rounded-lg hover:bg-rose-100 transition-colors">Reject</button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Final Approval Section */}
                                <div className="pt-6 border-t border-slate-100">
                                    <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-indigo-900">Final Business Approval</p>
                                            <p className="text-[10px] text-indigo-600 font-medium uppercase">Current: {vendor.isApproved ? 'Approved' : 'Pending Review'}</p>
                                        </div>
                                        <button
                                            onClick={() => performAction({ isApproved: !vendor.isApproved })}
                                            disabled={saving}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${vendor.isApproved ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                                        >
                                            {vendor.isApproved ? 'Revoke Business' : 'Activate Business'}
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
                <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                    <div className="relative w-full max-w-4xl h-[70vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowMapModal(false)} className="absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white text-slate-600 hover:text-rose-600 shadow-lg border border-slate-200 backdrop-blur-md rounded-full transition-all" title="Close map">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="flex-1 w-full bg-slate-100 relative">
                            <iframe className="absolute inset-0 w-full h-full z-10" src={`https://maps.google.com/maps?q=${vendor.address?.latitude},${vendor.address?.longitude}&z=15&output=embed`} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
