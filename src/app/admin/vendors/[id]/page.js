'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import Image from 'next/image';
import VendorTabs from '@/components/admin/VendorTabs';
import { DetailItem, StatusBadge, Badge, SidebarCard, UnifiedStatusMenu, ProgressItem, DocumentSection, MainPanelCard, VendorHeader } from '@/components/admin/VendorUIFragments';
import { AlertTriangle, ShieldCheck, UserCheck, Zap, Award, Search, Check as CheckIcon } from 'lucide-react';
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
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showProfileStatusMenu, setShowProfileStatusMenu] = useState(false);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const token = getToken();
        const profile = await fetch(`/api/admin/vendors/${id}`, { headers: { 'Authorization': 'Bearer ' + token } });
        if (profile.ok) {
          const data = await profile.json();
          console.log(data);
          if (data.data) setVendor(data.data);
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
      const res = await fetch('/api/admin/verify-document', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ vendorId: id, documentField: field, status, reason, index })
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

  const toggleVerification = async (field, forceValue = null) => {
    if (!vendor) return;
    try {
      const token = getToken();
      // Safe access: check root first, then vendorProfile
      let currentValue;
      if (field === 'profileStatus') {
        currentValue = vendor.vendorProfile?.status;
      } else {
        currentValue = vendor[field] !== undefined ? vendor[field] : vendor.vendorProfile?.[field];
      }

      const value = forceValue !== null ? forceValue : !currentValue;

      const res = await fetch(`/api/admin/vendors/${id}/update`, {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [field]: value })
      });

      if (res.ok) {
        setRefreshKey(old => old + 1);
      } else {
        alert('Failed to update field status');
      }
    } catch (e) {
      alert('An error occurred during update');
    }
  };

  const calculateKYCProgress = () => {
    const docs = vendor.vendorProfile?.documents || vendor.documents;
    if (!docs) return 0;
    const mandatory = ['aadharCard', 'panCard', 'businessRegistration', 'gstRegistration'];
    const uploaded = mandatory.filter(key => {
      const doc = docs[key];
      if (Array.isArray(doc)) return doc.length > 0 && doc.some(d => d.url);
      return doc && doc.url;
    });
    return Math.round((uploaded.length / mandatory.length) * 100);
  };

  const calculateBankProgress = () => {
    if (!vendor.vendorProfile?.bankDetails?.accountNumber && !vendor.bankDetails?.accountNumber) return 0;
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
  if (activeTab === 'business') return <BusinessTab vendor={vendor.vendorProfile} setVendor={setVendor} id={id} activeTab={activeTab} setActiveTab={setActiveTab} onRefresh={() => setRefreshKey(old => old + 1)} />;
  if (activeTab === 'package') return <PackageTab vendor={vendor} packages={packages} setPackages={setPackages} id={id} activeTab={activeTab} setActiveTab={setActiveTab} />;
  if (activeTab === 'documents') return <DocumentsTab vendor={vendor} setVendor={setVendor} id={id} activeTab={activeTab} setActiveTab={setActiveTab} onRefresh={() => setRefreshKey(old => old + 1)} />;

  return (
    <div className="min-h-screen bg-transparent relative">
      <VendorHeader vendor={vendor} onBack={() => router.back()} id={id} activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-[1600px] mx-auto p-8">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <SidebarCard title="Biological Operator" icon={UserCheck} colorClass="text-cyan-500" accentColor="via-cyan-500/50">
              <DetailItem label="Full Designation" value={vendor.name} mono />
              <DetailItem label="Carrier Frequency" value={vendor.phone} mono />
              <DetailItem label="Comm Link (Email)" value={vendor.email} mono />

              <div className="flex flex-wrap gap-2">
                <button onClick={() => toggleVerification('isVerified')} className="transition-transform active:scale-95 group cursor-pointer">
                  <Badge color={vendor.isVerified ? 'indigo' : 'slate'} icon={UserCheck}> {vendor.isVerified ? `Verified ${vendor.role}` : `Unverified ${vendor.role}`} </Badge>
                </button>
                <button onClick={() => toggleVerification('isVendorVerified')} className="transition-transform active:scale-95 group cursor-pointer">
                  <Badge color={vendor.isVendorVerified ? 'emerald' : 'slate'} icon={ShieldCheck}> {vendor.isVendorVerified ? 'Identity Verified' : 'Identity Unverified'} </Badge>
                </button>
              </div>
              <UnifiedStatusMenu label="Network Status" currentStatus={vendor.status} isOpen={showStatusMenu} onToggle={() => setShowStatusMenu(!showStatusMenu)} onSelect={(s) => toggleVerification('status', s)} colorTheme="indigo" />
            </SidebarCard>

            <SidebarCard title="Corp Structure" icon={Award} colorClass="text-indigo-400" accentColor="via-indigo-500/50">
              <DetailItem label="Corporate Entity ID" value={vendor.vendorProfile?.businessName} mono />
              <DetailItem label="Primary Signatory" value={vendor.vendorProfile?.ownerName} mono />
              <DetailItem label="Business Registration" value={vendor.vendorProfile?.businessRegistration} mono />
              <DetailItem label="Business Contact No." value={vendor.vendorProfile?.businessNumber} mono />

              {vendor.vendorProfile?.profileType === 'individual' ? (
                vendor.vendorProfile?.personalPanCard && <DetailItem label="PAN Card" value={vendor.vendorProfile?.personalPanCard} mono />
              ) : (
                vendor.vendorProfile?.gstNumber && <DetailItem label="GST Number" value={vendor.vendorProfile?.gstNumber} mono />
              )}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => toggleVerification('isApproved')} className="transition-transform active:scale-95 group cursor-pointer">
                  <Badge color={vendor.vendorProfile?.isApproved ? 'indigo' : 'slate'} icon={ShieldCheck}>{vendor.vendorProfile?.isApproved ? 'Business Approved' : 'Approval Pending'}</Badge>
                </button>
                <button onClick={() => toggleVerification('isOperating')} className="transition-transform active:scale-95 group cursor-pointer">
                  <Badge color={vendor.vendorProfile?.isOperating ? 'emerald' : 'slate'} icon={Zap}>{vendor.vendorProfile?.isOperating ? 'Operational' : 'Non-Operational'}</Badge>
                </button>
              </div>
              <UnifiedStatusMenu label="Profile Status" currentStatus={vendor.vendorProfile?.status} isOpen={showProfileStatusMenu} onToggle={() => setShowProfileStatusMenu(!showProfileStatusMenu)} onSelect={(s) => toggleVerification('profileStatus', s)} colorTheme="cyan" />
            </SidebarCard>

            <SidebarCard title="Boot Sequence Progress" icon={Zap} colorClass="text-indigo-300" accentColor="via-indigo-500/50">
              <div className="space-y-5 relative z-10">
                <ProgressItem label="Compliance Docs" percent={calculateKYCProgress()} color="bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                <ProgressItem label="Financial Uplink" percent={calculateBankProgress()} color="bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                <ProgressItem label="Profile Integration" percent={75} color="bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              </div>
            </SidebarCard>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <MainPanelCard title="Compliance Matrix & KYC" icon={ShieldCheck} description="Review Govt Issued IDs and Business Certificates.">
              <div className="grid grid-cols-1 gap-8">
                <DocumentSection title="Aadhar Card" docs={vendor.vendorProfile?.documents?.aadharCard || vendor.documents?.aadharCard} field="aadharCard" onVerify={verifyDocument} onOCR={triggerOCR} verifying={verifying} onPreview={setPreviewImage} ocr priority />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <DocumentSection title="PAN Card" docs={vendor.vendorProfile?.documents?.panCard || vendor.documents?.panCard} field="panCard" onVerify={verifyDocument} onOCR={triggerOCR} verifying={verifying} onPreview={setPreviewImage} ocr />
                  <DocumentSection title="Business Registration" docs={vendor.vendorProfile?.documents?.businessRegistration || vendor.documents?.businessRegistration} field="businessRegistration" onVerify={verifyDocument} onPreview={setPreviewImage} compact />
                  <DocumentSection title="GST Certificate" docs={vendor.vendorProfile?.documents?.gstRegistration || vendor.documents?.gstRegistration} field="gstRegistration" onVerify={verifyDocument} onPreview={setPreviewImage} compact />
                  <DocumentSection title="Travel Agent Permit" docs={vendor.vendorProfile?.documents?.travelAgentPermit || vendor.documents?.travelAgentPermit} field="travelAgentPermit" onVerify={verifyDocument} onPreview={setPreviewImage} />
                </div>
              </div>
            </MainPanelCard>
          </div>
        </div>
      </main>
      {previewImage && (
        <div onClick={() => setPreviewImage(null)} className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-12 cursor-zoom-out animate-in fade-in duration-300">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5">
              <Image src={previewImage} alt="Document Review" fill className="object-contain" priority sizes="100vw" />
            </div>

            <button className="absolute top-0 -right-2 sm:-right-8 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all border border-white/10 backdrop-blur-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



