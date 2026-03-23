'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import VendorTabs from '@/components/admin/VendorTabs';
import { DetailItem, StatusBadge } from '@/components/admin/VendorUIFragments';

export default function PersonalTab({ vendor, setVendor, id, activeTab, setActiveTab }) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        gender: '',
        dateOfBirth: '',
        designation: '',
        bio: '',
        website: '',
        socialLinks: {
            linkedin: '', twitter: '', instagram: '', github: '',
            youtube: '', whatsapp: '', telegram: '', snapchat: '',
            tiktok: '', other: ''
        },
        emergencyContact: {
            name: '', phone: '', relationship: ''
        },
        address: {
            addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India',
            latitude: '', longitude: ''
        },
        expertise: '',
        preferences: {
            language: 'en',
            notifications: { email: true, sms: true, push: true, whatsapp: true }
        }
    });

    // Initialize formData when vendor is loaded or tab mounts
    useEffect(() => {
        if (vendor) {
            const u = vendor.user || {};
            setFormData({
                name: u.name || '',
                phone: u.phone || '',
                gender: u.gender || '',
                dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
                designation: u.designation || '',
                bio: u.bio || '',
                website: u.website || '',
                socialLinks: {
                    linkedin: u.socialLinks?.linkedin || '',
                    twitter: u.socialLinks?.twitter || '',
                    instagram: u.socialLinks?.instagram || '',
                    github: u.socialLinks?.github || '',
                    youtube: u.socialLinks?.youtube || '',
                    whatsapp: u.socialLinks?.whatsapp || '',
                    telegram: u.socialLinks?.telegram || '',
                    snapchat: u.socialLinks?.snapchat || '',
                    tiktok: u.socialLinks?.tiktok || '',
                    other: u.socialLinks?.other || ''
                },
                emergencyContact: {
                    name: u.emergencyContact?.name || '',
                    phone: u.emergencyContact?.phone || '',
                    relationship: u.emergencyContact?.relationship || ''
                },
                address: {
                    addressLine1: u.address?.addressLine1 || '',
                    addressLine2: u.address?.addressLine2 || '',
                    city: u.address?.city || '',
                    state: u.address?.state || '',
                    pincode: u.address?.pincode || '',
                    country: u.address?.country || 'India',
                    latitude: u.address?.latitude || '',
                    longitude: u.address?.longitude || ''
                },
                expertise: u.expertise?.join(', ') || '',
                preferences: {
                    language: u.preferences?.language || 'en',
                    notifications: {
                        email: u.preferences?.notifications?.email ?? true,
                        sms: u.preferences?.notifications?.sms ?? true,
                        push: u.preferences?.notifications?.push ?? true,
                        whatsapp: u.preferences?.notifications?.whatsapp ?? true
                    }
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

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = getToken();
            const payload = {
                ...formData,
                expertise: formData.expertise.split(',').map(s => s.trim()).filter(Boolean)
            };
            const res = await fetch(`/api/admin/vendors/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
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



    if (!vendor) return (
        <div className="min-h-[80vh] flex items-center justify-center p-8">
            <div className="text-center max-w-md bg-[#111116] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)] rounded-xl p-8">
                <h2 className="text-xl font-bold font-mono text-rose-500 mb-2 uppercase tracking-widest">Entity Not Found</h2>
                <button onClick={() => router.back()} className="mt-6 px-6 py-2.5 border border-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-mono hover:bg-white/5 transition uppercase tracking-widest">Terminate Process</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent pb-24 relative">
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
                                <span className="text-indigo-400">Biological Operator</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">{vendor.user?.name || vendor.ownerName}</h1>
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
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        {/* Basic Identity */}
                        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none"></div>
                            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                            <h3 className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4 relative z-10 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                Bio-Identity Matrix
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Full Node Designation</label>
                                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Comm Frequency</label>
                                            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Sector Role</label>
                                            <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Chassis Type</label>
                                            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50">
                                                <option value="" className="bg-black text-slate-500">Select Parameter</option>
                                                <option value="male" className="bg-black text-cyan-50">Male</option>
                                                <option value="female" className="bg-black text-cyan-50">Female</option>
                                                <option value="other" className="bg-black text-cyan-50">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Initialization Date</label>
                                            <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 [color-scheme:dark]" />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Skill Vectors (CSV)</label>
                                            <input type="text" value={formData.expertise} onChange={(e) => setFormData({ ...formData, expertise: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" placeholder="e.g. Navigation, Encryption, Logistics" />
                                        </div>
                                        <div className="md:col-span-2 space-y-1 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Memory Log / Bio</label>
                                            <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 leading-relaxed" placeholder="Compile memory sequence..." />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="md:col-span-2 flex items-center gap-6 pb-6 mb-2 border-b border-white/5">
                                            <div className="relative group p-1.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                                <img
                                                    src={vendor.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.ownerName)}&background=111116&color=22d3ee&bold=true`}
                                                    alt={vendor.ownerName}
                                                    className="w-16 h-16 rounded-xl object-cover mix-blend-screen opacity-90"
                                                />
                                                <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay pointer-events-none rounded-2xl"></div>
                                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-md border border-white/10 flex items-center justify-center ${vendor.user?.isVerified ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold font-mono text-cyan-50 uppercase tracking-widest">{vendor.ownerName}</h4>
                                                <p className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">{vendor.user?.email || 'NIL_COMM_UPLINK'}</p>
                                                <div className="flex items-center gap-3 pt-2">
                                                    <StatusBadge status={vendor.user?.status} />
                                                    <span className="text-[9px] font-mono font-bold px-2.5 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-md uppercase tracking-widest">
                                                        Auth System: {vendor.user?.authProvider || 'Email'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <DetailItem label="Assigned Designation" value={vendor.user?.name} mono />
                                        <DetailItem label="Role Token" value={vendor.user?.designation} mono />
                                        <DetailItem label="Transmission Key" value={vendor.user?.phone} mono />
                                        <DetailItem label="Hardware Profile" value={vendor.user?.gender} mono />
                                        <DetailItem label="Boot Sequence Date" value={vendor.user?.dateOfBirth ? new Date(vendor.user.dateOfBirth).toLocaleDateString() : null} mono />
                                        <div className="md:col-span-2 pt-1 border-t border-white/5 mt-2 pt-4">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-3">Install Base / Vectors</label>
                                            <div className="flex flex-wrap gap-2">
                                                {vendor.user?.expertise?.length > 0 ? vendor.user.expertise.map(exp => (
                                                    <span key={exp} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold rounded-md border border-indigo-500/30 uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.1)]">{exp}</span>
                                                )) : <span className="text-[10px] font-mono text-slate-500 italic uppercase">System empty</span>}
                                            </div>
                                        </div>
                                        <div className="col-span-2 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Memory Logs Overview</label>
                                            <p className="text-[12px] text-cyan-50/80 font-mono leading-relaxed mt-2">
                                                {vendor.user?.bio || 'Core logs returning empty sequence.'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Personal Address */}
                        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none"></div>
                            <h3 className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4 relative z-10 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Base Coordinates
                            </h3>
                            <div className="relative z-10">
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Home Address Vector 1</label>
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
                                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Zip/Pincode</label>
                                        <input type="text" value={formData.address.pincode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Global Region</label>
                                        <input type="text" value={formData.address.country} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                    </div>
                                    <div className="space-y-1 pt-4 border-t border-white/5">
                                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Latitude</label>
                                        <input type="text" value={formData.address.latitude} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, latitude: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                    </div>
                                    <div className="space-y-1 pt-4 border-t border-white/5">
                                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Longitude</label>
                                        <input type="text" value={formData.address.longitude} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, longitude: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[12px] text-cyan-50/80 font-mono leading-relaxed pb-4 border-b border-white/5 mb-4">
                                        {[
                                            vendor.user?.address?.addressLine1,
                                            vendor.user?.address?.addressLine2,
                                            vendor.user?.address?.city,
                                            vendor.user?.address?.state,
                                            vendor.user?.address?.pincode,
                                            vendor.user?.address?.country
                                        ].filter(Boolean).join(', ') || 'No coordinates provided.'}
                                    </p>
                                    <div className="flex gap-8">
                                        <DetailItem label="Latitude" value={vendor.user?.address?.latitude || '0.0000'} mono />
                                        <DetailItem label="Longitude" value={vendor.user?.address?.longitude || '0.0000'} mono />
                                    </div>
                                </>
                            )}
                            </div>
                        </div>

                        {/* Social Presence Expansion */}
                        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none"></div>
                            <h3 className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4 relative z-10 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                Network Links
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Core Domain</label>
                                            <input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" placeholder="https://..." />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">LinkedIn</label>
                                            <input type="text" value={formData.socialLinks.linkedin} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Instagram</label>
                                            <input type="text" value={formData.socialLinks.instagram} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">X / Twitter</label>
                                            <input type="text" value={formData.socialLinks.twitter} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">GitHub</label>
                                            <input type="text" value={formData.socialLinks.github} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, github: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">YouTube</label>
                                            <input type="text" value={formData.socialLinks.youtube} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Telegram</label>
                                            <input type="text" value={formData.socialLinks.telegram} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, telegram: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">WhatsApp Link</label>
                                            <input type="text" value={formData.socialLinks.whatsapp} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, whatsapp: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Snapchat</label>
                                            <input type="text" value={formData.socialLinks.snapchat} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, snapchat: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">TikTok</label>
                                            <input type="text" value={formData.socialLinks.tiktok} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, tiktok: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Other Hubs / Links</label>
                                            <input type="text" value={formData.socialLinks.other} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, other: e.target.value } })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DetailItem label="Core Domain" value={vendor.user?.website} mono />
                                        <DetailItem label="LinkedIn" value={vendor.user?.socialLinks?.linkedin} mono />
                                        <DetailItem label="Instagram" value={vendor.user?.socialLinks?.instagram} mono />
                                        <DetailItem label="Twitter (X)" value={vendor.user?.socialLinks?.twitter} mono />
                                        <DetailItem label="GitHub" value={vendor.user?.socialLinks?.github} mono />
                                        <DetailItem label="YouTube" value={vendor.user?.socialLinks?.youtube} mono />
                                        <DetailItem label="Telegram" value={vendor.user?.socialLinks?.telegram} mono />
                                        <DetailItem label="WhatsApp" value={vendor.user?.socialLinks?.whatsapp} mono />
                                        <DetailItem label="Snapchat" value={vendor.user?.socialLinks?.snapchat} mono />
                                        <DetailItem label="TikTok" value={vendor.user?.socialLinks?.tiktok} mono />
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block">Other Links</label>
                                            <p className="text-xs font-mono text-cyan-50/70 truncate mt-1">{vendor.user?.socialLinks?.other || 'Offline'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        {/* Emergency Contacts */}
                        <div className="bg-[#111116] rounded-xl border border-rose-500/20 p-8 shadow-[0_0_20px_rgba(244,63,94,0.1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] pointer-events-none rounded-full"></div>
                            <div className="flex items-center gap-3 mb-6 border-b border-rose-500/10 pb-4 relative z-10">
                                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h3 className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-[0.2em] shadow-[0_0_5px_currentColor]">SOS Directive</h3>
                            </div>
                            <div className="space-y-5 relative z-10">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-rose-400/70 uppercase tracking-[0.2em]">Contact Unit</label>
                                            <input type="text" value={formData.emergencyContact.name} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} className="w-full px-4 py-2 bg-black/50 border border-rose-500/20 rounded-lg focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 outline-none text-xs font-mono text-rose-100 placeholder-rose-900" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-rose-400/70 uppercase tracking-[0.2em]">Comm Relay</label>
                                            <input type="text" value={formData.emergencyContact.phone} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} className="w-full px-4 py-2 bg-black/50 border border-rose-500/20 rounded-lg focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 outline-none text-xs font-mono text-rose-100 placeholder-rose-900" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-rose-400/70 uppercase tracking-[0.2em]">Link/Relation</label>
                                            <input type="text" value={formData.emergencyContact.relationship} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })} className="w-full px-4 py-2 bg-black/50 border border-rose-500/20 rounded-lg focus:ring-1 focus:ring-rose-500/50 focus:border-rose-500 outline-none text-xs font-mono text-rose-100 placeholder-rose-900" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DetailItem label="Contact Unit" value={vendor.user?.emergencyContact?.name} mono />
                                        <DetailItem label="Comm Relay (Phone)" value={vendor.user?.emergencyContact?.phone} mono />
                                        <DetailItem label="Link Context" value={vendor.user?.emergencyContact?.relationship} mono />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Account Stats & Status */}
                        <div className="bg-black/80 rounded-xl border border-indigo-500/20 p-8 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none rounded-full"></div>
                            <h3 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-[0.2em] mb-6 border-b border-indigo-500/10 pb-4 relative z-10 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                                System Core Metadata
                            </h3>
                            <div className="space-y-5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Network Status</span>
                                    <StatusBadge status={vendor.user?.status} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Trust Metric</span>
                                    <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                                        <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">{vendor.user?.rating?.average || 0}</span>
                                        <span className="text-slate-500 text-[10px]">({vendor.user?.rating?.count || 0})</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Locale Config</span>
                                    <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-cyan-50 uppercase tracking-widest">{vendor.user?.preferences?.language || 'en'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Last Uplink</span>
                                    <span className="text-[10px] font-mono font-bold text-cyan-200">{vendor.user?.lastLoginAt ? new Date(vendor.user.lastLoginAt).toLocaleString() : 'Offline'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">EULA Validated</span>
                                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${vendor.user?.termsAccepted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                        {vendor.user?.termsAccepted ? 'Confirmed' : 'Pending'}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-4">Ping Routes (Notifications)</span>
                                    {isEditing ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            {['email', 'sms', 'push', 'whatsapp'].map(chan => (
                                                <label key={chan} className="flex items-center gap-3 cursor-pointer group">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.preferences.notifications[chan]}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                preferences: {
                                                                    ...formData.preferences,
                                                                    notifications: {
                                                                        ...formData.preferences.notifications,
                                                                        [chan]: e.target.checked
                                                                    }
                                                                }
                                                            })}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-8 h-4 rounded-full transition-colors ${formData.preferences.notifications[chan] ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5 border border-white/10'}`}></div>
                                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${formData.preferences.notifications[chan] ? 'translate-x-4' : ''}`}></div>
                                                    </div>
                                                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest group-hover:text-cyan-200 transition-colors">{chan}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {['email', 'sms', 'push', 'whatsapp'].map(chan => (
                                                <div key={chan} className={`px-2.5 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-widest ${vendor.user?.preferences?.notifications?.[chan] ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.1)]' : 'bg-transparent border-white/5 text-slate-600'}`}>
                                                    {chan}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Administrative Quick Actions */}
                        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative overflow-hidden">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                            <h3 className="text-[10px] font-mono font-bold text-cyan-500 uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-4 flex items-center gap-2">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                Overwrite Permissions
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-mono font-bold text-cyan-50 uppercase tracking-widest">Node State Control</p>
                                            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wide">Current: {vendor.user?.status}</p>
                                        </div>
                                        <StatusBadge status={vendor.user?.status} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => performAction({ status: 'active' })}
                                            disabled={saving || (vendor.user?.status === 'active')}
                                            className={`py-2.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${vendor.user?.status === 'active' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-transparent text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/40'}`}
                                        >
                                            {vendor.user?.status === 'active' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            {saving && vendor.user?.status !== 'active' ? 'PROCESSING...' : 'ACTIVATE'}
                                        </button>
                                        <button
                                            onClick={() => performAction({ status: 'suspended' })}
                                            disabled={saving || (vendor.user?.status === 'suspended')}
                                            className={`py-2.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${vendor.user?.status === 'suspended' ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-transparent text-rose-600 border border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/40'}`}
                                        >
                                            {vendor.user?.status === 'suspended' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            SUSPEND
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
