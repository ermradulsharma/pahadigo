'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import VendorTabs from '@/components/admin/VendorTabs';
import { DetailItem, StatusBadge, MainPanelCard, SidebarCard, VendorHeader, Modal, UnifiedStatusMenu } from '@/components/admin/VendorUIFragments';
import { Building2, Landmark, ShieldCheck, MapPin, User, Check as CheckIcon, Layers, Share2, Briefcase, Camera, Play, Hash, MessageSquare, Phone, Globe, Music2 } from 'lucide-react';

export default function BusinessTab({ vendor, setVendor, id, activeTab, setActiveTab }) {
  const router = useRouter();
  const [showMapModal, setShowMapModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
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

  const headerActions = (
    <div className="flex items-center gap-6 shrink-0">
      <UnifiedStatusMenu label="Node State" currentStatus={vendor.status} isOpen={showStatusMenu} onToggle={() => setShowStatusMenu(!showStatusMenu)} onSelect={(newStatus) => performAction({ status: newStatus })} colorTheme="indigo" />
      {!isEditing ? (
        <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold tracking-widest hover:bg-indigo-500/30 hover:border-indigo-400/50 hover:text-indigo-300 transition shadow-[0_0_15px_rgba(99,102,241,0.2)] uppercase"> Modify Matrix</button>
      ) : (
        <>
          <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-xs font-mono font-bold tracking-widest uppercase text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition border border-transparent hover:border-white/10"> Abort</button>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold tracking-widest hover:bg-emerald-500/30 hover:border-emerald-400/50 hover:text-emerald-300 transition shadow-[0_0_15px_rgba(16,185,129,0.2)] uppercase disabled:opacity-50"> {saving ? 'Transmitting...' : 'Commit Changes'}</button>
        </>
      )}
    </div>
  );

  const isBusiness = vendor?.profileType === 'business';
  return (
    <div className="min-h-screen bg-transparent pb-24 relative">
      <VendorHeader vendor={vendor} onBack={() => router.back()} id={id} activeTab={activeTab} setActiveTab={setActiveTab} actions={headerActions} />
      <main className="max-w-[1600px] mx-auto p-8 relative z-10">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-6 space-y-6">
            {/* Vendor Profile Info */}
            <MainPanelCard title={isBusiness ? "Lead Operator Analytics" : "Bio-Operator Node Data"} icon={User} colorClass="text-cyan-500">
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
            </MainPanelCard>

            {/* Entity Details */}
            <MainPanelCard title={isBusiness ? "Corporate Entity Architecture" : "Professional Identity Matrix"} icon={isBusiness ? Building2 : ShieldCheck} colorClass="text-cyan-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 relative z-10">
                {isEditing ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">{isBusiness ? "Entity Name" : "Trading Alias / Name"}</label>
                      <input type="text" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Corp Comm Channel</label>
                      <input type="text" value={formData.businessNumber} onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">{isBusiness ? "Gov Identifier (GST)" : "Professional ID / Tax"}</label>
                      <input type="text" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 uppercase" />
                    </div>
                    {isBusiness && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">Registration Hash</label>
                        <input type="text" value={formData.businessRegistration} onChange={(e) => setFormData({ ...formData, businessRegistration: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 uppercase" />
                      </div>
                    )}
                    <div className="col-span-2">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">{isBusiness ? "Entity Blueprint / Log" : "Professional Bio / Mission"}</label>
                      <textarea rows={4} value={formData.businessAbout} onChange={(e) => setFormData({ ...formData, businessAbout: e.target.value })} className="w-full px-4 py-2.5 bg-black/50 border border-white/10 rounded-lg focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none text-xs font-mono text-cyan-50 leading-relaxed" />
                    </div>
                  </>
                ) : (
                  <>
                    <DetailItem label={isBusiness ? "Entity Legal Name" : "Trading Alias / Name"} value={vendor.businessName} mono />
                    <DetailItem label="Direct Comm Channel" value={vendor.businessNumber} mono />
                    <DetailItem label={isBusiness ? "Gov Identifier (GST)" : "Professional ID / Tax"} value={vendor.gstNumber} mono />
                    {isBusiness && <DetailItem label="Registration Hash" value={vendor.businessRegistration} mono />}
                    <div className="col-span-2">
                      <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-2">{isBusiness ? "Entity Blueprint" : "Professional Bio"}</label>
                      <p className="text-[12px] text-cyan-50/80 font-mono leading-relaxed">
                        {vendor.businessAbout || (isBusiness ? 'Blueprint not available.' : 'Bio logs returning empty.')}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </MainPanelCard>

            {/* Service Categories Matrix */}
            <MainPanelCard title="Operational Sectors / Categories" icon={Layers} colorClass="text-indigo-400">
              <div className="flex flex-wrap gap-2.5 relative z-10">
                {vendor?.category?.length > 0 ? vendor.category.map((cat, idx) => (
                  <span key={cat.id || idx} className="px-4 py-1.5 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono font-bold rounded-lg border border-indigo-500/20 uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.05)] hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-default">
                    {cat.name}
                  </span>
                )) : (
                  <p className="text-[11px] text-slate-600 font-mono italic">No operational sectors registered.</p>
                )}
              </div>
            </MainPanelCard>
          </div>
          <div className="col-span-12 lg:col-span-6 space-y-6">
            {/* HQ Location */}
            <MainPanelCard title="Corporate Operations Base" icon={MapPin} colorClass="text-cyan-500">
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
                          <MapPin className="w-4 h-4" />
                          Initiate Coordinate Scan
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </MainPanelCard>

            {/* Financial Settlement */}
            <SidebarCard title="Finance & Ledger Node" icon={Landmark} colorClass="text-emerald-500" accentColor="via-emerald-500/50">
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
                    <div className="col-span-2 pt-4 border-t border-emerald-500/20 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Fiscal Authorization Payload</p>
                          {vendor.bankDetails.cancelledCheque?.url ? (
                            <a href={vendor.bankDetails.cancelledCheque.url} target="_blank" className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 hover:underline uppercase tracking-widest flex items-center gap-1 transition-colors">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>View Cancelled Cheque
                            </a>
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest italic">No payload uploaded</span>
                          )}
                        </div>
                        <StatusBadge status={vendor.bankDetails.cancelledCheque?.status} />
                      </div>
                      {vendor.bankDetails.cancelledCheque?.status === 'pending' && (
                        <div className="flex gap-2 isolate pt-2">
                          <button onClick={() => verifyDocument('bankDetails.cancelledCheque', 'verified')} className="flex-1 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase tracking-widest rounded hover:bg-emerald-500/30 hover:border-emerald-400/50 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]">Authorize Ledger</button>
                          <button onClick={() => {
                            const reason = prompt("Enter fiscal denial reason:");
                            if (reason) verifyDocument('bankDetails.cancelledCheque', 'rejected', reason);
                          }} className="flex-1 px-4 py-2 bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono font-bold uppercase tracking-widest rounded hover:bg-rose-500/30 hover:border-rose-400/50 transition-all shadow-[0_0_15px_rgba(244,63,94,0.15)]">Deny Ledger</button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-emerald-500/50 font-mono italic py-4">Financial protocols pending initiation.</p>
                )}
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
