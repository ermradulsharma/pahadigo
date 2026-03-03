'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import VendorTabs from '@/components/admin/VendorTabs';
import { DetailItem, StatusBadge } from '@/components/admin/VendorUIFragments';

export default function PersonalProfilePage({ params }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const router = useRouter();
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
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
                        const u = found.user || {};
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

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
            <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-[13px] font-medium text-slate-500">Loading Personal Profile</p>
        </div>
    );

    if (!vendor) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
            <div className="text-center max-w-md">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Vendor not found</h2>
                <button onClick={() => router.back()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-sm hover:bg-indigo-700 transition">Go Back</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 pb-24">
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
                                <span className="text-slate-600">Personal Profile</span>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 leading-none">{vendor.user?.name || vendor.ownerName}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="px-5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition shadow-sm">
                                Edit Personal Info
                            </button>
                        ) : (
                            <>
                                <button onClick={() => setIsEditing(false)} className="px-5 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-semibold transition">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving} className="px-8 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm disabled:opacity-50">
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <VendorTabs id={id} />

            <main className="max-w-[1600px] mx-auto p-8">
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        {/* Basic Identity */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Personal Identity</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Number</label>
                                            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Designation</label>
                                            <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gender</label>
                                            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold">
                                                <option value="">Select Gender</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date of Birth</label>
                                            <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expertise / Skills (Comma separated)</label>
                                            <input type="text" value={formData.expertise} onChange={(e) => setFormData({ ...formData, expertise: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="e.g. Trekking, Camping, Photography" />
                                        </div>
                                        <div className="md:col-span-2 space-y-1 pt-4 border-t border-slate-50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Personal Bio</label>
                                            <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm leading-relaxed" placeholder="Short professional bio..." />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="md:col-span-2 flex items-center gap-6 pb-6 mb-2 border-b border-slate-50">
                                            <div className="relative group">
                                                <img
                                                    src={vendor.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.ownerName)}&background=6366f1&color=fff&bold=true`}
                                                    alt={vendor.ownerName}
                                                    className="w-20 h-20 rounded-2xl object-cover border-4 border-slate-50 shadow-sm"
                                                />
                                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${vendor.user?.isVerified ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.713 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.713 3.066 3.066 0 012.812 2.812 3.066 3.066 0 00.713 1.745 3.066 3.066 0 010 3.976 3.066 3.066 0 00-.713 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.713 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.713 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.713-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.713-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{vendor.ownerName}</h4>
                                                <p className="text-xs text-slate-500 font-medium">{vendor.user?.email || 'No email associated'}</p>
                                                <div className="flex items-center gap-3 pt-1">
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${vendor.user?.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {vendor.user?.status === 'active' ? 'Account Active' : `Account ${vendor.user?.status || 'Inactive'}`}
                                                    </span>
                                                    <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase">
                                                        Auth: {vendor.user?.authProvider || 'Email'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <DetailItem label="Full Name" value={vendor.user?.name} />
                                        <DetailItem label="Designation" value={vendor.user?.designation} />
                                        <DetailItem label="Contact Number" value={vendor.user?.phone} />
                                        <DetailItem label="Gender" value={vendor.user?.gender} />
                                        <DetailItem label="Date of Birth" value={vendor.user?.dateOfBirth ? new Date(vendor.user.dateOfBirth).toLocaleDateString() : null} />
                                        <div className="md:col-span-2 pt-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Expertise & Skills</label>
                                            <div className="flex flex-wrap gap-2">
                                                {vendor.user?.expertise?.length > 0 ? vendor.user.expertise.map(exp => (
                                                    <span key={exp} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg border border-indigo-100 uppercase">{exp}</span>
                                                )) : <span className="text-xs text-slate-400 italic">No expertise listed</span>}
                                            </div>
                                        </div>
                                        <div className="col-span-2 pt-4 border-t border-slate-50">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">About Owner</label>
                                            <p className="text-[14px] text-slate-600 leading-relaxed">
                                                {vendor.user?.bio || 'No profile bio provided.'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Personal Address */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Personal Location</h3>
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Home Address Line 1</label>
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
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pincode</label>
                                        <input type="text" value={formData.address.pincode} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Country</label>
                                        <input type="text" value={formData.address.country} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                    </div>
                                    <div className="space-y-1 pt-4 border-t border-slate-50">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Latitude</label>
                                        <input type="text" value={formData.address.latitude} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, latitude: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                    </div>
                                    <div className="space-y-1 pt-4 border-t border-slate-50">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Longitude</label>
                                        <input type="text" value={formData.address.longitude} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, longitude: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-[14px] text-slate-600 font-medium pb-4 border-b border-slate-50 mb-4">
                                        {[
                                            vendor.user?.address?.addressLine1,
                                            vendor.user?.address?.addressLine2,
                                            vendor.user?.address?.city,
                                            vendor.user?.address?.state,
                                            vendor.user?.address?.pincode,
                                            vendor.user?.address?.country
                                        ].filter(Boolean).join(', ') || 'No personal address provided.'}
                                    </p>
                                    <div className="flex gap-8">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Latitude</label>
                                            <p className="text-xs font-mono text-slate-600">{vendor.user?.address?.latitude || '0.0000'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Longitude</label>
                                            <p className="text-xs font-mono text-slate-600">{vendor.user?.address?.longitude || '0.0000'}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Social Presence Expansion */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Digital Presence</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Website</label>
                                            <input type="text" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" placeholder="https://..." />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LinkedIn</label>
                                            <input type="text" value={formData.socialLinks.linkedin} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, linkedin: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instagram</label>
                                            <input type="text" value={formData.socialLinks.instagram} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, instagram: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Twitter (X)</label>
                                            <input type="text" value={formData.socialLinks.twitter} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, twitter: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GitHub</label>
                                            <input type="text" value={formData.socialLinks.github} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, github: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">YouTube</label>
                                            <input type="text" value={formData.socialLinks.youtube} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, youtube: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telegram</label>
                                            <input type="text" value={formData.socialLinks.telegram} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, telegram: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WhatsApp Link</label>
                                            <input type="text" value={formData.socialLinks.whatsapp} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, whatsapp: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Snapchat</label>
                                            <input type="text" value={formData.socialLinks.snapchat} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, snapchat: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TikTok</label>
                                            <input type="text" value={formData.socialLinks.tiktok} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, tiktok: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other Links / Portfolio</label>
                                            <input type="text" value={formData.socialLinks.other} onChange={(e) => setFormData({ ...formData, socialLinks: { ...formData.socialLinks, other: e.target.value } })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DetailItem label="Website" value={vendor.user?.website} />
                                        <DetailItem label="LinkedIn" value={vendor.user?.socialLinks?.linkedin} />
                                        <DetailItem label="Instagram" value={vendor.user?.socialLinks?.instagram} />
                                        <DetailItem label="Twitter (X)" value={vendor.user?.socialLinks?.twitter} />
                                        <DetailItem label="GitHub" value={vendor.user?.socialLinks?.github} />
                                        <DetailItem label="YouTube" value={vendor.user?.socialLinks?.youtube} />
                                        <DetailItem label="Telegram" value={vendor.user?.socialLinks?.telegram} />
                                        <DetailItem label="WhatsApp" value={vendor.user?.socialLinks?.whatsapp} />
                                        <DetailItem label="Snapchat" value={vendor.user?.socialLinks?.snapchat} />
                                        <DetailItem label="TikTok" value={vendor.user?.socialLinks?.tiktok} />
                                        <div className="col-span-2 space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Other Source</label>
                                            <p className="text-sm font-medium text-slate-600 truncate">{vendor.user?.socialLinks?.other || 'None'}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        {/* Emergency Contacts */}
                        <div className="bg-white rounded-2xl border border-rose-100 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6 border-b border-rose-50 pb-4">
                                <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.268 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Emergency Contact</h3>
                            </div>
                            <div className="space-y-5">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Person Name</label>
                                            <input type="text" value={formData.emergencyContact.name} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} className="w-full px-4 py-2 bg-rose-50/30 border border-rose-100 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</label>
                                            <input type="text" value={formData.emergencyContact.phone} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} className="w-full px-4 py-2 bg-rose-50/30 border border-rose-100 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relationship</label>
                                            <input type="text" value={formData.emergencyContact.relationship} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relationship: e.target.value } })} className="w-full px-4 py-2 bg-rose-50/30 border border-rose-100 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none text-sm font-bold" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DetailItem label="Full Name" value={vendor.user?.emergencyContact?.name} />
                                        <DetailItem label="Emergency Phone" value={vendor.user?.emergencyContact?.phone} />
                                        <DetailItem label="Relationship" value={vendor.user?.emergencyContact?.relationship} />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Account Stats & Status */}
                        <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl shadow-indigo-500/10">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Account Metadata</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Status</span>
                                    <StatusBadge status={vendor.user?.status} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Overall Rating</span>
                                    <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                                        <span>{vendor.user?.rating?.average || 0}</span>
                                        <span className="text-slate-500 text-[10px]">({vendor.user?.rating?.count || 0})</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Language</span>
                                    <span className="text-xs font-bold bg-slate-800 px-3 py-1 rounded-full uppercase">{vendor.user?.preferences?.language || 'en'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Last Active</span>
                                    <span className="text-xs font-bold text-slate-400">{vendor.user?.lastLoginAt ? new Date(vendor.user.lastLoginAt).toLocaleString() : 'Never'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Terms Accepted</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${vendor.user?.termsAccepted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {vendor.user?.termsAccepted ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div className="pt-2 border-t border-white/5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Notification Preferences</span>
                                    {isEditing ? (
                                        <div className="grid grid-cols-2 gap-3">
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
                                                        <div className={`w-8 h-4 rounded-full transition-colors ${formData.preferences.notifications[chan] ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
                                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${formData.preferences.notifications[chan] ? 'translate-x-4' : ''}`}></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-slate-200 transition-colors">{chan}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-4 gap-2">
                                            {['email', 'sms', 'push', 'whatsapp'].map(chan => (
                                                <div key={chan} className={`px-2 py-1.5 rounded-lg text-center text-[10px] font-bold uppercase ${vendor.user?.preferences?.notifications?.[chan] ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-500'}`}>
                                                    {chan}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Administrative Quick Actions */}
                        <div className="bg-white rounded-2xl border border-indigo-100 p-8 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Account Activation</h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">User Account Status</p>
                                            <p className="text-[10px] text-slate-500 font-medium uppercase">Current: {vendor.user?.status}</p>
                                        </div>
                                        <StatusBadge status={vendor.user?.status} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => performAction({ status: 'active' })}
                                            disabled={saving || (vendor.user?.status === 'active')}
                                            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${vendor.user?.status === 'active' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-emerald-600 border border-emerald-100 hover:bg-emerald-50'}`}
                                        >
                                            {vendor.user?.status === 'active' && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            {saving && vendor.user?.status !== 'active' ? 'Activating...' : 'Activate Account'}
                                        </button>
                                        <button
                                            onClick={() => performAction({ status: 'suspended' })}
                                            disabled={saving || (vendor.user?.status === 'suspended')}
                                            className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${vendor.user?.status === 'suspended' ? 'bg-rose-500 text-white shadow-lg' : 'bg-white text-rose-600 border border-rose-100 hover:bg-rose-50'}`}
                                        >
                                            Deactivate / Suspend
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
