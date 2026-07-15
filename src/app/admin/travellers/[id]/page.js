'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

import { DetailItem, StatusBadge, SidebarCard, MainPanelCard, VendorHeader, Modal, UnifiedStatusMenu } from '@/components/admin/VendorUIFragments.js';
import { AlertTriangle, Zap, MapPin, Link2, User, Activity, Fingerprint, Globe, UserCheck, Share2, Code, CalendarDays, Heart, Plus } from 'lucide-react';
import Loading from '@/components/admin/Loading.js';
import api from '@/core/Api/index.js';
import { useToast } from '@/components/ui/ToastContext.js';

export default function TravellerViewPage({ params }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const router = useRouter();
    const [traveller, setTraveller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [showMapModal, setShowMapModal] = useState(false);
    const toast = useToast();
    
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingPackages, setBookingPackages] = useState([]);
    const [creatingBooking, setCreatingBooking] = useState(false);
    const [bookingData, setBookingData] = useState({
        packageItem: '', // String representing the index or ID of selected service
        startDate: '',
        endDate: '',
        adults: 1,
        children: 0,
        basePrice: 0,
        total: 0,
        paymentStatus: 'paid'
    });

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
        bloodGroup: '',
        medicalConditions: '',
        preferences: {
            language: 'en',
            notifications: { email: true, sms: true, push: true, whatsapp: true }
        }
    });

    const initFormData = (data) => {
        const ec = data.emergencyContacts?.[0] || {};
        setFormData({
            name: data.name || '',
            phone: data.phone || '',
            gender: data.gender || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
            designation: data.designation || '',
            bio: data.bio || '',
            website: data.website || '',
            socialLinks: {
                linkedin: data.socialLinks?.linkedin || '',
                twitter: data.socialLinks?.twitter || '',
                instagram: data.socialLinks?.instagram || '',
                github: data.socialLinks?.github || '',
                youtube: data.socialLinks?.youtube || '',
                whatsapp: data.socialLinks?.whatsapp || '',
                telegram: data.socialLinks?.telegram || '',
                snapchat: data.socialLinks?.snapchat || '',
                tiktok: data.socialLinks?.tiktok || '',
                other: data.socialLinks?.other || ''
            },
            emergencyContact: {
                name: ec.name || '',
                phone: ec.phone || '',
                relationship: ec.relationship || ''
            },
            address: {
                addressLine1: data.address?.addressLine1 || '',
                addressLine2: data.address?.addressLine2 || '',
                city: data.address?.city || '',
                state: data.address?.state || '',
                pincode: data.address?.pincode || '',
                country: data.address?.country || 'India',
                latitude: data.address?.latitude || '',
                longitude: data.address?.longitude || ''
            },
            expertise: Array.isArray(data.expertise) ? data.expertise.join(', ') : '',
            bloodGroup: data.bloodGroup || '',
            medicalConditions: Array.isArray(data.medicalConditions) ? data.medicalConditions.join(', ') : '',
            preferences: {
                language: data.preferences?.language || 'en',
                notifications: {
                    email: data.preferences?.notifications?.email ?? true,
                    sms: data.preferences?.notifications?.sms ?? true,
                    push: data.preferences?.notifications?.push ?? true,
                    whatsapp: data.preferences?.notifications?.whatsapp ?? true
                }
            }
        });
    };

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const data = await api.admin.travellers.getById(id);
                if (data.success && mounted) {
                    setTraveller(data.data?.traveller);
                    initFormData(data.data?.traveller);
                } else if (mounted) {
                    setError(data.error || 'Failed to fetch traveller data');
                }
            } catch (err) {
                if (mounted) setError('An error occurred while fetching traveller data');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        if (id) load();
        return () => { mounted = false; };
    }, [id]);

    const performAction = async (actionData) => {
        setSaving(true);
        try {
            const data = await api.admin.travellers.update(id, actionData);
            if (data.success) {
                setTraveller(data.data?.traveller);
                initFormData(data.data?.traveller);
            } else {
                toast("Action failed: " + (data.error || "Unknown error"), 'error');
            }
        } catch (e) {
            toast("Error communicating with server.", 'error');
        } finally {
            setSaving(false);
        }
    };

    const fetchPackagesForBooking = async () => {
        try {
            const data = await api.admin.packages.getAll();
            if (data.success && data.data?.packages) {
                setBookingPackages(data.data.packages);
            }
        } catch (err) {
            // failed to fetch packages
        }
    };

    useEffect(() => {
        if (showBookingModal && bookingPackages.length === 0) {
            fetchPackagesForBooking();
        }
    }, [showBookingModal]);

    const handlePackageChange = (e) => {
        const pkgId = e.target.value;
        const selectedService = bookingPackages.find(p => p._id === pkgId);
        
        let newBasePrice = 0;
        if (selectedService?.pricing) {
            newBasePrice = selectedService.pricing.sellingPrice || selectedService.pricing.basePrice || 0;
        }

        setBookingData({
            ...bookingData,
            packageItem: pkgId,
            basePrice: newBasePrice,
            total: newBasePrice * (bookingData.adults || 1) // Simple initial calculation
        });
    };

    // Auto calculate total when occupancy changes
    useEffect(() => {
        if (bookingData.basePrice > 0) {
            setBookingData(prev => ({
                ...prev,
                total: prev.basePrice * (prev.adults || 1)
            }));
        }
    }, [bookingData.adults]);

    const handleCreateBooking = async (e) => {
        e.preventDefault();
        setCreatingBooking(true);
        try {
            const selectedService = bookingPackages.find(p => p._id === bookingData.packageItem);
            if (!selectedService) {
                toast("Please select a valid package", 'error');
                setCreatingBooking(false);
                return;
            }

            const payload = {
                user: id,
                vendor: selectedService.vendorId,
                packageId: selectedService.catalogId,
                item: {
                    itemId: selectedService._id,
                    itemType: selectedService.serviceType,
                    title: selectedService.title || selectedService.name
                },
                startDate: bookingData.startDate,
                endDate: bookingData.endDate,
                occupancy: {
                    adults: parseInt(bookingData.adults),
                    children: parseInt(bookingData.children)
                },
                pricing: {
                    basePrice: parseFloat(bookingData.basePrice),
                    subTotal: parseFloat(bookingData.total),
                    total: parseFloat(bookingData.total)
                },
                paymentStatus: bookingData.paymentStatus
            };

            const data = await api.admin.bookings.create(payload);
            if (data.success) {
                toast("Booking successfully created.", 'success');
                setShowBookingModal(false);
                
                // Refresh traveller data
                const refreshData = await api.admin.travellers.getById(id);
                if (refreshData.success) {
                    setTraveller(refreshData.data?.traveller);
                }
            } else {
                toast(data.error || "Failed to create booking.", 'error');
            }
        } catch (err) {
            toast("Error creating booking.", 'error');
        } finally {
            setCreatingBooking(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                emergencyContacts: [formData.emergencyContact],
                expertise: formData.expertise.split(',').map(s => s.trim()).filter(Boolean),
                medicalConditions: formData.medicalConditions.split(',').map(s => s.trim()).filter(Boolean)
            };
            delete payload.emergencyContact;
            
            const data = await api.admin.travellers.update(id, payload);
            if (data.success) {
                setTraveller(data.data?.traveller);
                setIsEditing(false);
                toast("Profile updated successfully", 'success');
            } else {
                toast("Failed to update profile: " + (data.error || "Unknown error"), 'error');
            }
        } catch (e) {
            toast("Error updating profile", 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading message="Loading Traveller Profile Matrix..." />;

    if (error || !traveller) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-8">
                <div className="text-center max-w-md bg-[#111116] border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.1)] rounded-xl p-8">
                    <h2 className="text-xl font-bold font-mono text-rose-500 mb-2 uppercase tracking-widest">Entity Not Found</h2>
                    <p className="text-xs text-rose-400 mb-6 font-mono tracking-wide">{error}</p>
                    <button onClick={() => router.back()} className="px-6 py-2.5 border border-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-mono hover:bg-white/5 transition uppercase tracking-widest">Terminate Process</button>
                </div>
            </div>
        );
    }

    const headerActions = (
        <div className="flex items-center gap-3 relative z-50">
            <button onClick={() => setShowBookingModal(true)} className="px-4 py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold tracking-widest hover:bg-indigo-500/30 hover:border-indigo-400/50 hover:text-indigo-300 transition flex items-center gap-2">
                <Plus size={14} /> New Booking
            </button>
            <UnifiedStatusMenu label="Node State" currentStatus={traveller.status} isOpen={showStatusMenu} onToggle={() => setShowStatusMenu(!showStatusMenu)} onSelect={(newStatus) => performAction({ status: newStatus })} colorTheme="cyan" />
            {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold tracking-widest hover:bg-indigo-500/30 hover:border-indigo-400/50 hover:text-indigo-300 transition shadow-[0_0_15px_rgba(99,102,241,0.2)] uppercase">Modify Matrix</button>
            ) : (
                <>
                    <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-xs font-mono font-bold tracking-widest uppercase text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition border border-transparent hover:border-white/10">Abort</button>
                    <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold tracking-widest hover:bg-emerald-500/30 hover:border-emerald-400/50 hover:text-emerald-300 transition shadow-[0_0_15px_rgba(16,185,129,0.2)] uppercase disabled:opacity-50">{saving ? 'Transmitting...' : 'Commit Changes'}</button>
                </>
            )}
        </div>
    );

    // Mock vendor object structure for VendorHeader compatibility
    const headerMockData = {
        name: traveller.name,
        email: traveller.email,
        phone: traveller.phone,
        status: traveller.status,
        isVerified: traveller.isVerified,
        authProvider: traveller.authProvider,
        profileImage: traveller.profileImage
    };

    return (
        <div className="min-h-screen bg-transparent relative pb-10">
            <VendorHeader vendor={headerMockData} onBack={() => router.back()} id={id} actions={headerActions} disableTabs={true} />
            
            <main className="max-w-[1600px] mx-auto p-8 relative z-10 -mt-6">
                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        {/* Basic Identity */}
                        <MainPanelCard title="Bio-Identity Matrix" icon={User} colorClass="text-cyan-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Full Node Designation</label>
                                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Comm Frequency (Phone)</label>
                                            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Chassis Type (Gender)</label>
                                            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50">
                                                <option value="" className="bg-black text-slate-500">Select Parameter</option>
                                                <option value="male" className="bg-black text-cyan-50">Male</option>
                                                <option value="female" className="bg-black text-cyan-50">Female</option>
                                                <option value="other" className="bg-black text-cyan-50">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Initialization Date (DOB)</label>
                                            <input type="date" value={formData.dateOfBirth} onClick={(e) => e.target.showPicker && e.target.showPicker()} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 [color-scheme:dark] cursor-pointer" />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Skill Vectors (CSV)</label>
                                            <input type="text" value={formData.expertise} onChange={(e) => setFormData({ ...formData, expertise: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" placeholder="e.g. Hiking, Photography" />
                                        </div>
                                        <div className="md:col-span-2 space-y-1 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Memory Log / Bio</label>
                                            <textarea rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 leading-relaxed" placeholder="Compile memory sequence..." />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="md:col-span-2 flex items-center gap-6">
                                            <div className="relative group p-1.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                                <img src={traveller?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(traveller.name)}&background=111116&color=22d3ee&bold=true`} alt={traveller.name} className="w-16 h-16 rounded-xl object-cover mix-blend-screen opacity-90" />
                                                <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay pointer-events-none rounded-2xl"></div>
                                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-md border border-white/10 flex items-center justify-center ${traveller.isVerified ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-bold font-mono text-cyan-50 uppercase tracking-widest">{traveller.name}</h4>
                                                <p className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">{traveller.email || traveller._id}</p>
                                                <div className="flex items-center gap-3 pt-2">
                                                    <StatusBadge status={traveller.status} />
                                                    <span className="text-[9px] font-mono font-bold px-2.5 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-md uppercase tracking-widest">
                                                        Auth System: {traveller.authProvider || 'Email'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <DetailItem label="Assigned Designation" value={traveller.name} mono />
                                        <DetailItem label="Transmission Key" value={traveller.phone} mono />
                                        <DetailItem label="Hardware Profile" value={traveller.gender} mono />
                                        <DetailItem label="Boot Sequence Date" value={traveller.dateOfBirth ? new Date(traveller.dateOfBirth).toLocaleDateString() : null} mono />
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-3">Install Base / Vectors</label>
                                            <div className="flex flex-wrap gap-2">
                                                {traveller.expertise?.length > 0 ? traveller.expertise.map(exp => (
                                                    <span key={exp} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold rounded-md border border-indigo-500/30 uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.1)]">{exp}</span>
                                                )) : <span className="text-[10px] font-mono text-slate-500 italic uppercase">System empty</span>}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Memory Logs Overview</label>
                                            <p className="text-[12px] text-cyan-50/80 font-mono leading-relaxed mt-2">
                                                {traveller.bio || 'Core logs returning empty sequence.'}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </MainPanelCard>

                        {/* Geographic Coordinates */}
                        <MainPanelCard title="Base Coordinates" icon={MapPin} colorClass="text-cyan-500">
                            <div className="relative z-10">
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
                                                traveller.address?.addressLine1,
                                                traveller.address?.addressLine2,
                                                traveller.address?.city,
                                                traveller.address?.state,
                                                traveller.address?.pincode,
                                                traveller.address?.country
                                            ].filter(Boolean).join(', ') || 'No coordinates provided.'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-8">
                                                <DetailItem label="Latitude" value={traveller.address?.latitude || '0.0000'} mono />
                                                <DetailItem label="Longitude" value={traveller.address?.longitude || '0.0000'} mono />
                                            </div>
                                            {traveller.address?.latitude && traveller.address?.longitude && (
                                                <button onClick={() => setShowMapModal(true)} className="px-4 py-2 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em] rounded-lg border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/40 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                                                    <MapPin className="w-3 h-3" />
                                                    Live Vector Scan
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </MainPanelCard>

                        {/* Recent Bookings */}
                        <MainPanelCard title="Booking Activity Logs" icon={CalendarDays} colorClass="text-cyan-500">
                            <div className="relative z-10 space-y-4">
                                {traveller.bookings && traveller.bookings.length > 0 ? (
                                    traveller.bookings.map((booking, idx) => (
                                        <div key={idx} className="p-4 bg-black/40 border border-white/5 rounded-xl hover:border-cyan-500/20 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="text-xs font-mono font-bold text-cyan-50 uppercase tracking-widest">{booking.item?.title || 'Unknown Package'}</h4>
                                                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">Code: {booking.bookingCode}</p>
                                                </div>
                                                <StatusBadge status={booking.status} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/5">
                                                <DetailItem label="Start Date" value={new Date(booking.startDate).toLocaleDateString()} mono />
                                                <DetailItem label="End Date" value={new Date(booking.endDate).toLocaleDateString()} mono />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/5">
                                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">No booking logs found in vector</p>
                                    </div>
                                )}
                            </div>
                        </MainPanelCard>

                        {/* Wishlist Items */}
                        <MainPanelCard title="Wishlist Vectors" icon={Heart} colorClass="text-rose-400">
                            <div className="relative z-10 space-y-4">
                                {traveller.wishlists && traveller.wishlists.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {traveller.wishlists.map((w, idx) => (
                                            <div key={idx} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl hover:border-rose-500/30 transition-colors flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                                    <Heart className="w-4 h-4 text-rose-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-mono font-bold text-rose-100 uppercase tracking-widest">{w.category || 'Package'}</p>
                                                    <p className="text-[9px] text-rose-400/60 font-mono tracking-widest mt-0.5 truncate w-40">{w.itemId}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 border border-dashed border-rose-500/10 rounded-xl bg-rose-500/5">
                                        <p className="text-[10px] font-mono text-rose-500/60 uppercase tracking-widest">No wishlist items tracked</p>
                                    </div>
                                )}
                            </div>
                        </MainPanelCard>
                    </div>

                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        {/* Emergency Protocol */}
                        <SidebarCard title="SOS Directive" icon={AlertTriangle} colorClass="text-rose-400" accentColor="via-rose-500/50">
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
                                        <DetailItem label="Contact Unit" value={traveller.emergencyContacts?.[0]?.name} mono />
                                        <DetailItem label="Comm Relay (Phone)" value={traveller.emergencyContacts?.[0]?.phone} mono />
                                        <DetailItem label="Link Context" value={traveller.emergencyContacts?.[0]?.relationship} mono />
                                    </>
                                )}
                            </div>
                        </SidebarCard>

                        {/* System Core Metadata */}
                        <SidebarCard title="System Core Metadata" icon={Zap} colorClass="text-indigo-400">
                            <div className="space-y-5 relative z-10">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Network Status</span>
                                    <StatusBadge status={traveller.status} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Locale Config</span>
                                    <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-cyan-50 uppercase tracking-widest">{traveller.preferences?.language || 'en'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Last Uplink</span>
                                    <span className="text-[10px] font-mono font-bold text-cyan-200">{traveller.lastLoginAt ? new Date(traveller.lastLoginAt).toLocaleString() : 'Offline'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">EULA Validated</span>
                                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${traveller.termsAccepted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                                        {traveller.termsAccepted ? 'Confirmed' : 'Pending'}
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
                                                <div key={chan} className={`px-2.5 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-widest ${traveller.preferences?.notifications?.[chan] ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.1)]' : 'bg-transparent border-white/5 text-slate-600'}`}>
                                                    {chan}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </SidebarCard>

                        {/* Safety & Medical Core */}
                        <SidebarCard title="Safety & Medical Protocols" icon={Activity} colorClass="text-emerald-400" accentColor="via-emerald-500/50">
                            <div className="space-y-4 relative z-10">
                                {isEditing ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-emerald-400/70 uppercase tracking-[0.2em]">Blood Group Vector</label>
                                            <select value={formData.bloodGroup} onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })} className="w-full px-4 py-2 bg-black/50 border border-emerald-500/20 rounded-lg focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-xs font-mono text-emerald-50">
                                                <option value="">Unknown</option>
                                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-mono font-bold text-emerald-400/70 uppercase tracking-[0.2em]">Medical Anomalies (CSV)</label>
                                            <textarea rows={2} value={formData.medicalConditions} onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })} className="w-full px-4 py-2 bg-black/50 border border-emerald-500/20 rounded-lg focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none text-xs font-mono text-emerald-50" placeholder="List chronic conditions..." />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <DetailItem label="Blood Type Identifier" value={traveller.bloodGroup} mono />
                                        <div className="pt-2">
                                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Medical Conditions</label>
                                            <div className="flex flex-wrap gap-2">
                                                {traveller.medicalConditions?.length > 0 ? traveller.medicalConditions.map(cond => (
                                                    <span key={cond} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold rounded border border-emerald-500/20 uppercase tracking-widest">{cond}</span>
                                                )) : <span className="text-[10px] font-mono text-slate-600 italic uppercase">No conditions logged</span>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </SidebarCard>

                        {/* Authentication Matrix */}
                        <SidebarCard title="Authentication Matrix" icon={Fingerprint} colorClass="text-indigo-400">
                            <div className="space-y-4 relative z-10">
                                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">Linked Security Providers</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'google', icon: Globe, label: 'Google', active: !!traveller.googleId },
                                        { id: 'apple', icon: UserCheck, label: 'Apple', active: !!traveller.appleId },
                                        { id: 'facebook', icon: Share2, label: 'Facebook', active: !!traveller.facebookId },
                                        { id: 'github', icon: Code, label: 'GitHub', active: !!traveller.githubId }
                                    ].map(provider => (
                                        <div key={provider.id} className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${provider.active ? 'bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'bg-transparent border-white/5 opacity-40'}`}>
                                            <provider.icon className={`w-4 h-4 ${provider.active ? 'text-indigo-400' : 'text-slate-600'}`} />
                                            <div className="space-y-0.5">
                                                <p className={`text-[9px] font-mono font-bold uppercase tracking-widest ${provider.active ? 'text-cyan-50' : 'text-slate-600'}`}>{provider.label}</p>
                                                <p className="text-[7px] font-mono text-slate-500 uppercase">{provider.active ? 'Linked' : 'Offline'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </SidebarCard>
                    </div>
                </div>
            </main>

            {/* Create Booking Modal */}
            <Modal isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} title="Create Override Booking" icon={CalendarDays} maxWidth="max-w-2xl">
                <form onSubmit={handleCreateBooking} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Select Package/Service</label>
                            <select
                                value={bookingData.packageItem}
                                onChange={handlePackageChange}
                                required
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                            >
                                <option value="" disabled>-- Select a Package --</option>
                                {bookingPackages.map(pkg => (
                                    <option key={pkg._id} value={pkg._id}>
                                        [{pkg.serviceType.toUpperCase()}] {pkg.title || pkg.name} (by {pkg.vendor?.businessName || 'Unknown'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Start Date</label>
                            <input
                                type="date" required
                                value={bookingData.startDate}
                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                onChange={(e) => setBookingData({ ...bookingData, startDate: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 [color-scheme:dark] cursor-pointer"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">End Date</label>
                            <input
                                type="date" required
                                value={bookingData.endDate}
                                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                                onChange={(e) => setBookingData({ ...bookingData, endDate: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 [color-scheme:dark] cursor-pointer"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Adults</label>
                            <input
                                type="number" min="1" required
                                value={bookingData.adults}
                                onChange={(e) => setBookingData({ ...bookingData, adults: parseInt(e.target.value) || 1 })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Children</label>
                            <input
                                type="number" min="0" required
                                value={bookingData.children}
                                onChange={(e) => setBookingData({ ...bookingData, children: parseInt(e.target.value) || 0 })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Base Price (INR)</label>
                            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm cursor-not-allowed flex items-center justify-between">
                                <span>₹ {bookingData.basePrice}</span>
                                <span className="text-[9px] font-mono text-cyan-500/60 uppercase">System Derived</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Total Price (INR)</label>
                            <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm cursor-not-allowed flex items-center justify-between shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]">
                                <span>₹ {bookingData.total}</span>
                                <span className="text-[9px] font-mono text-cyan-500/60 uppercase">Calculated</span>
                            </div>
                        </div>

                        <div className="space-y-2 col-span-2">
                            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Payment Status Override</label>
                            <select
                                value={bookingData.paymentStatus}
                                onChange={(e) => setBookingData({ ...bookingData, paymentStatus: e.target.value })}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                            >
                                <option value="paid">Paid (Confirmed)</option>
                                <option value="unpaid">Unpaid (Pending)</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
                        <button type="button" onClick={() => setShowBookingModal(false)} className="px-6 py-2.5 rounded-lg text-xs font-mono font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest">
                            Cancel
                        </button>
                        <button type="submit" disabled={creatingBooking} className="px-6 py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold hover:bg-indigo-500/30 transition-all uppercase tracking-widest disabled:opacity-50">
                            {creatingBooking ? 'Transmitting...' : 'Commit Booking'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Map Modal */}
            <Modal isOpen={showMapModal} onClose={() => setShowMapModal(false)} title="Coordinate Visualization Matrix" icon={MapPin}>
                <div className="h-[70vh] w-full bg-black relative p-1">
                    <iframe className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] z-10 rounded-lg filter invert-[90%] hue-rotate-180 contrast-125 saturate-50" src={`https://maps.google.com/maps?q=${traveller.address?.latitude},${traveller.address?.longitude}&z=15&output=embed`} />
                </div>
            </Modal>
        </div>
    );
}
