'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import { CATEGORY_MAP } from '@/core/Constants/categories';
import VendorTabs from '@/components/admin/VendorTabs';
import PackageCard, { getServiceName, getPrice } from '@/components/admin/PackageCard';

export default function PackageTab({ vendor, packages, setPackages, id, activeTab, setActiveTab }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);

  const toggleStatus = async (pkg, newStatus) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/packages/${pkg._id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId: id,
          serviceType: pkg.serviceType,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setPackages(prev => prev.map(p =>
          (p._id === pkg._id && p.serviceType === pkg.serviceType)
            ? { ...p, isActive: newStatus }
            : p
        ));
      }
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const groupedPackages = {};
  if (vendor && Array.isArray(vendor.category)) {
    vendor.category.forEach(catObj => {
      if (typeof catObj === 'object' && catObj !== null && catObj.slug) {
        const mappedCategory = CATEGORY_MAP[catObj.slug] || catObj.slug;
        groupedPackages[mappedCategory] = [];
      } else if (typeof catObj === 'string') {
        const mappedCategory = CATEGORY_MAP[catObj] || catObj;
        groupedPackages[mappedCategory] = [];
      }
    });
  }

  packages.forEach(pkg => {
    const cat = pkg.serviceType;
    if (groupedPackages[cat]) {
      groupedPackages[cat].push(pkg);
    }
  });

  const formatCategoryName = (name) => {
    return name.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 relative">
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-white/10 px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => selectedCategory ? setSelectedCategory(null) : router.back()} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 border border-transparent hover:border-white/10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">
                <Link href="/admin/vendors" className="hover:text-cyan-400 transition-colors">Vendor DB</Link>
                <span className="text-slate-700">/</span>
                <span className={`${selectedCategory ? 'text-indigo-400 cursor-pointer hover:text-indigo-300' : 'text-white'}`} onClick={() => setSelectedCategory(null)}>Package Matrix</span>
                {selectedCategory && (
                  <>
                    <span className="text-slate-700">/</span>
                    <span className="text-white">{formatCategoryName(selectedCategory)}</span>
                  </>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                {selectedCategory ? `Manage Mod: ${formatCategoryName(selectedCategory)}` : 'Service Topology'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <VendorTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-[1600px] mx-auto px-8 py-8 relative z-10">
        {!selectedCategory ? (
          /* Level 1: Category Selection Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Object.entries(groupedPackages).map(([category, items]) => (
              <button key={category} onClick={() => setSelectedCategory(category)} className="group bg-[#111116] p-8 rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all text-left relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-5 group-hover:opacity-10 pointer-events-none transition-opacity"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] group-hover:bg-cyan-500/20 transition-colors duration-500"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-400 border border-indigo-500/30 group-hover:border-cyan-500/50 transition-all mb-6 shadow-[inset_0_0_15px_rgba(99,102,241,0.2)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <h3 className="text-lg font-bold font-mono text-cyan-50 mb-1 uppercase tracking-tight">{formatCategoryName(category)}</h3>
                  <p className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-[0.2em]">{items.length} Active Nodes</p>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 group-hover:via-cyan-400 group-hover:shadow-[0_0_10px_rgba(34,211,238,1)] to-transparent opacity-50 group-hover:opacity-100 transition-all"></div>
              </button>
            ))}
          </div>
        ) : (
          /* Level 2: Items Grid */
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedCategory(null)} className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-all">Return to Root</button>
                <div className="h-4 w-[1px] bg-white/10"></div>
                <span className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-widest">Displaying {groupedPackages[selectedCategory].length} node(s) in {formatCategoryName(selectedCategory)}</span>
              </div>
            </div>

            {groupedPackages[selectedCategory].length === 0 ? (
              <div className="bg-[#111116] rounded-xl border border-white/10 p-16 flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <div className="w-24 h-24 mb-6 relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-pulse blur-xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold font-mono text-cyan-50 mb-2 uppercase tracking-widest">Zero Nodes Detected</h3>
                <p className="text-slate-500 max-w-sm text-xs font-mono">This vendor hasn't instantiated any packages under the <strong className="text-cyan-400">{formatCategoryName(selectedCategory)}</strong> cluster yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedPackages[selectedCategory].map((pkg) => (
                  <PackageCard key={pkg._id} pkg={pkg} inspectHref={`/admin/packages/item/${pkg._id}`} onToggleStatus={(p, status) => toggleStatus(p, status)} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
