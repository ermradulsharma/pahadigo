import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import VendorTabs from '@/components/admin/VendorTabs';
import { DetailItem, StatusBadge, Badge, SidebarCard, UnifiedStatusMenu, ProgressItem, DocumentSection, MainPanelCard, VendorHeader, Modal } from '@/components/admin/VendorUIFragments';
import { AlertTriangle, ShieldCheck, UserCheck, Zap, Award, Search, Check as CheckIcon, MapPin, Link2, User, Activity, Fingerprint, Globe, Code, Share2 } from 'lucide-react';

export default function PersonalTab({ vendor, setVendor, id, activeTab, setActiveTab }) {
  const router = useRouter();
  const [showMapModal, setShowMapModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
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
    bloodGroup: '',
    medicalConditions: '',
    preferences: {
      language: 'en',
      notifications: { email: true, sms: true, push: true, whatsapp: true }
    }
  });

  // Initialize formData when vendor is loaded or tab mounts
  useEffect(() => {
    if (vendor) {
      const ec = vendor.emergencyContacts?.[0] || {};
      setFormData({
        name: vendor.name || '',
        phone: vendor.phone || '',
        gender: vendor.gender || '',
        dateOfBirth: vendor.dateOfBirth ? new Date(vendor.dateOfBirth).toISOString().split('T')[0] : '',
        designation: vendor.designation || '',
        bio: vendor.bio || '',
        website: vendor.website || '',
        socialLinks: {
          linkedin: vendor.socialLinks?.linkedin || '',
          twitter: vendor.socialLinks?.twitter || '',
          instagram: vendor.socialLinks?.instagram || '',
          github: vendor.socialLinks?.github || '',
          youtube: vendor.socialLinks?.youtube || '',
          whatsapp: vendor.socialLinks?.whatsapp || '',
          telegram: vendor.socialLinks?.telegram || '',
          snapchat: vendor.socialLinks?.snapchat || '',
          tiktok: vendor.socialLinks?.tiktok || '',
          other: vendor.socialLinks?.other || ''
        },
        emergencyContact: {
          name: ec.name || '',
          phone: ec.phone || '',
          relationship: ec.relationship || ''
        },
        address: {
          addressLine1: vendor.address?.addressLine1 || '',
          addressLine2: vendor.address?.addressLine2 || '',
          city: vendor.address?.city || '',
          state: vendor.address?.state || '',
          pincode: vendor.address?.pincode || '',
          country: vendor.address?.country || 'India',
          latitude: vendor.address?.latitude || '',
          longitude: vendor.address?.longitude || ''
        },
        expertise: Array.isArray(vendor.expertise) ? vendor.expertise.join(', ') : '',
        bloodGroup: vendor.bloodGroup || '',
        medicalConditions: Array.isArray(vendor.medicalConditions) ? vendor.medicalConditions.join(', ') : '',
        preferences: {
          language: vendor.preferences?.language || 'en',
          notifications: {
            email: vendor.preferences?.notifications?.email ?? true,
            sms: vendor.preferences?.notifications?.sms ?? true,
            push: vendor.preferences?.notifications?.push ?? true,
            whatsapp: vendor.preferences?.notifications?.whatsapp ?? true
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
        emergencyContacts: [formData.emergencyContact], // Wrap back to array for API
        expertise: formData.expertise.split(',').map(s => s.trim()).filter(Boolean),
        medicalConditions: formData.medicalConditions.split(',').map(s => s.trim()).filter(Boolean)
      };
      delete payload.emergencyContact; // Remove temporary singular object
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

  const headerActions = (
    <div className="flex items-center gap-6 shrink-0">
      <UnifiedStatusMenu label="Node State" currentStatus={vendor.status} isOpen={showStatusMenu} onToggle={() => setShowStatusMenu(!showStatusMenu)} onSelect={(newStatus) => performAction({ status: newStatus })} colorTheme="cyan" />
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

  return (
    <div className="min-h-screen bg-transparent relative">
      <VendorHeader vendor={vendor} onBack={() => router.back()} id={id} activeTab={activeTab} setActiveTab={setActiveTab} actions={headerActions} />
      <main className="max-w-[1600px] mx-auto p-8 relative z-10">
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
                    <div className="md:col-span-2 flex items-center gap-6">
                      <div className="relative group p-1.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        <img src={vendor?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.name)}&background=111116&color=22d3ee&bold=true`} alt={vendor.name} className="w-16 h-16 rounded-xl object-cover mix-blend-screen opacity-90" />
                        <div className="absolute inset-0 bg-cyan-500/20 mix-blend-overlay pointer-events-none rounded-2xl"></div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-md border border-white/10 flex items-center justify-center ${vendor.isVerified ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-500'}`}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold font-mono text-cyan-50 uppercase tracking-widest">{vendor.name}</h4>
                        <p className="text-[10px] text-indigo-300 font-mono tracking-widest uppercase">{vendor.email || vendor._id}</p>
                        <div className="flex items-center gap-3 pt-2">
                          <StatusBadge status={vendor.status} />
                          <span className="text-[9px] font-mono font-bold px-2.5 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-md uppercase tracking-widest">
                            Auth System: {vendor.authProvider || 'Email'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DetailItem label="Assigned Designation" value={vendor.name} mono />
                    <DetailItem label="Role Token" value={vendor.designation} mono />
                    <DetailItem label="Transmission Key" value={vendor.phone} mono />
                    <DetailItem label="Hardware Profile" value={vendor.gender} mono />
                    <DetailItem label="Boot Sequence Date" value={vendor.dateOfBirth ? new Date(vendor.dateOfBirth).toLocaleDateString() : null} mono />
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-3">Install Base / Vectors</label>
                      <div className="flex flex-wrap gap-2">
                        {vendor.expertise?.length > 0 ? vendor.expertise.map(exp => (
                          <span key={exp} className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold rounded-md border border-indigo-500/30 uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.1)]">{exp}</span>
                        )) : <span className="text-[10px] font-mono text-slate-500 italic uppercase">System empty</span>}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Memory Logs Overview</label>
                      <p className="text-[12px] text-cyan-50/80 font-mono leading-relaxed mt-2">
                        {vendor.bio || 'Core logs returning empty sequence.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </MainPanelCard>

            {/* Personal Address */}
            <MainPanelCard title="Base Coordinates" icon={MapPin} colorClass="text-cyan-500">
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
                        vendor.address?.addressLine1,
                        vendor.address?.addressLine2,
                        vendor.address?.city,
                        vendor.address?.state,
                        vendor.address?.pincode,
                        vendor.address?.country
                      ].filter(Boolean).join(', ') || 'No coordinates provided.'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-8">
                        <DetailItem label="Latitude" value={vendor.address?.latitude || '0.0000'} mono />
                        <DetailItem label="Longitude" value={vendor.address?.longitude || '0.0000'} mono />
                      </div>
                      {vendor.address?.latitude && vendor.address?.longitude && (
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

            {/* Social Presence Expansion */}
            <MainPanelCard title="Network Links" icon={Link2} colorClass="text-cyan-500">
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
                    <DetailItem label="Core Domain" value={vendor.website} mono />
                    <DetailItem label="LinkedIn" value={vendor.socialLinks?.linkedin} mono />
                    <DetailItem label="Instagram" value={vendor.socialLinks?.instagram} mono />
                    <DetailItem label="Twitter (X)" value={vendor.socialLinks?.twitter} mono />
                    <DetailItem label="GitHub" value={vendor.socialLinks?.github} mono />
                    <DetailItem label="YouTube" value={vendor.socialLinks?.youtube} mono />
                    <DetailItem label="Telegram" value={vendor.socialLinks?.telegram} mono />
                    <DetailItem label="WhatsApp" value={vendor.socialLinks?.whatsapp} mono />
                    <DetailItem label="Snapchat" value={vendor.socialLinks?.snapchat} mono />
                    <DetailItem label="TikTok" value={vendor.socialLinks?.tiktok} mono />
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block">Other Links</label>
                      <p className="text-xs font-mono text-cyan-50/70 truncate mt-1">{vendor.socialLinks?.other || 'Offline'}</p>
                    </div>
                  </>
                )}
              </div>
            </MainPanelCard>
          </div>

          <div className="col-span-12 lg:col-span-5 space-y-6">
            {/* Emergency Contacts */}
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
                    <DetailItem label="Contact Unit" value={vendor.emergencyContacts?.[0]?.name} mono />
                    <DetailItem label="Comm Relay (Phone)" value={vendor.emergencyContacts?.[0]?.phone} mono />
                    <DetailItem label="Link Context" value={vendor.emergencyContacts?.[0]?.relationship} mono />
                  </>
                )}
              </div>
            </SidebarCard>

            {/* Account Stats & Status */}
            <SidebarCard title="System Core Metadata" icon={Zap} colorClass="text-indigo-400">
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Network Status</span>
                  <StatusBadge status={vendor.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Trust Metric</span>
                  <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                    <span className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">{vendor.rating?.average || 0}</span>
                    <span className="text-slate-500 text-[10px]">({vendor.rating?.count || 0})</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Locale Config</span>
                  <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-cyan-50 uppercase tracking-widest">{vendor.preferences?.language || 'en'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Last Uplink</span>
                  <span className="text-[10px] font-mono font-bold text-cyan-200">{vendor.lastLoginAt ? new Date(vendor.lastLoginAt).toLocaleString() : 'Offline'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">EULA Validated</span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded uppercase ${vendor.termsAccepted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    {vendor.termsAccepted ? 'Confirmed' : 'Pending'}
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
                        <div key={chan} className={`px-2.5 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-widest ${vendor.preferences?.notifications?.[chan] ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.1)]' : 'bg-transparent border-white/5 text-slate-600'}`}>
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
                    <DetailItem label="Blood Type Identifier" value={vendor.bloodGroup} mono />
                    <div className="pt-2">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">Medical Conditions</label>
                      <div className="flex flex-wrap gap-2">
                        {vendor.medicalConditions?.length > 0 ? vendor.medicalConditions.map(cond => (
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
                    { id: 'google', icon: Globe, label: 'Google', active: !!vendor.googleId },
                    { id: 'apple', icon: UserCheck, label: 'Apple', active: !!vendor.appleId },
                    { id: 'facebook', icon: Share2, label: 'Facebook', active: !!vendor.facebookId },
                    { id: 'github', icon: Code, label: 'GitHub', active: !!vendor.githubId }
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

      {/* Map Modal */}
      <Modal isOpen={showMapModal} onClose={() => setShowMapModal(false)} title="Coordinate Visualization Matrix" icon={MapPin}>
        <div className="h-[70vh] w-full bg-black relative p-1">
          <iframe className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] z-10 rounded-lg filter invert-[90%] hue-rotate-180 contrast-125 saturate-50" src={`https://maps.google.com/maps?q=${vendor.address?.latitude},${vendor.address?.longitude}&z=15&output=embed`} />
        </div>
      </Modal>
    </div>
  );
}
