'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';
import VendorTabs from '@/components/admin/VendorTabs';

export default function VendorPackagesPage({ params }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const router = useRouter();
    const [vendor, setVendor] = useState(null);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [viewingItem, setViewingItem] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getToken();

                // Fetch Vendor Info for Header
                const vendorRes = await fetch('/api/admin/vendors', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (vendorRes.ok) {
                    const vendorData = await vendorRes.json();
                    const found = (vendorData.data?.vendors || []).find(v => v._id === id);
                    if (found) setVendor(found);
                }

                // Fetch All Packages and Filter by Vendor ID
                const pkgRes = await fetch('/api/admin/packages', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const pkgData = await pkgRes.json();
                if (pkgData.success) {
                    const vendorPackages = pkgData.data.packages.filter(pkg => pkg.vendorId === id);
                    setPackages(vendorPackages);
                }
            } catch (error) {
                console.error("Failed to fetch vendor packages:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const toggleStatus = async (pkg) => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/packages', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vendorId: pkg.vendorId,
                    serviceType: pkg.serviceType,
                    serviceId: pkg._id,
                    status: !pkg.isActive
                })
            });
            const data = await res.json();
            if (data.success) {
                setPackages(prev => prev.map(p =>
                    (p._id === pkg._id && p.serviceType === pkg.serviceType)
                        ? { ...p, isActive: !p.isActive }
                        : p
                ));
            }
        } catch (error) {
            alert("Failed to update status");
        }
    };

    const groupedPackages = packages.reduce((acc, pkg) => {
        const cat = pkg.serviceType || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(pkg);
        return acc;
    }, {});

    const getServiceName = (pkg) => {
        return pkg.title ||
            pkg.tourDetails?.tourName ||
            pkg.details?.jumpName ||
            pkg.details?.stretchName ||
            pkg.vehicleDetails?.model ||
            pkg.roomDetails?.roomType ||
            pkg.details?.trekType ||
            pkg.details?.serviceType ||
            'Unnamed Service';
    };

    const getPrice = (pkg) => {
        return pkg.pricing?.pricePerNight ||
            pkg.pricing?.pricePerPerson ||
            pkg.pricing?.pricePerDay ||
            pkg.pricing?.baseFare ||
            0;
    };

    const formatCategoryName = (name) => {
        return name.replace(/([A-Z])/g, ' $1').trim();
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Loading Repository...</p>
            </div>
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
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-8 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => selectedCategory ? setSelectedCategory(null) : router.back()} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </button>
                        <div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                <Link href="/admin/vendors" className="hover:text-indigo-600 transition-colors">Vendors</Link>
                                <span>/</span>
                                <span className={`${selectedCategory ? 'text-indigo-600 cursor-pointer' : 'text-slate-900'}`} onClick={() => setSelectedCategory(null)}>Packages</span>
                                {selectedCategory && (
                                    <>
                                        <span>/</span>
                                        <span className="text-slate-900">{formatCategoryName(selectedCategory)}</span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                {selectedCategory ? `Manage ${formatCategoryName(selectedCategory)}` : 'Service Categories'}
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <VendorTabs id={id} />

            <main className="max-w-[1600px] mx-auto px-8 py-8">
                {!selectedCategory ? (
                    /* Level 1: Category Selection Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Object.entries(groupedPackages).map(([category, items]) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-50 transition-all text-left relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-600 transition-colors duration-500 opacity-20"></div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-6">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">{formatCategoryName(category)}</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{items.length} Active Services</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    /* Level 2: Items Grid */
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                                >
                                    Back to Categories
                                </button>
                                <div className="h-4 w-[1px] bg-slate-200"></div>
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                    Viewing {groupedPackages[selectedCategory].length} items in {formatCategoryName(selectedCategory)}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupedPackages[selectedCategory].map((pkg) => (
                                <div key={pkg._id} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col">
                                    {/* Thumbnail */}
                                    <div className="relative h-48 w-full bg-slate-100">
                                        {pkg.photos?.[0]?.url ? (
                                            <img src={pkg.photos[0].url} alt={getServiceName(pkg)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-1h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${pkg.isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                                {pkg.isActive ? 'Active' : 'Hidden'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="mb-6">
                                            <h4 className="font-black text-slate-900 text-lg leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">{getServiceName(pkg)}</h4>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                                <span className="line-clamp-1">{typeof pkg.location === 'object' ? pkg.location?.address : (pkg.location || 'Standard Location')}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between py-4 border-t border-slate-50">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Base Fare</div>
                                                <div className="text-xl font-black text-slate-900 tracking-tight">₹{Number(getPrice(pkg)).toLocaleString()}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setViewingItem(pkg)}
                                                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                                                    title="View Details"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(pkg)}
                                                    className={`p-2.5 rounded-xl border transition-all ${pkg.isActive ? 'border-rose-100 text-rose-600 hover:bg-rose-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
                                                    title={pkg.isActive ? 'Deactivate' : 'Activate'}
                                                >
                                                    {pkg.isActive ? (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Level 3: Details Panel */}
            {viewingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setViewingItem(null)}></div>
                    <div className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{getServiceName(viewingItem)}</h2>
                                <p className="text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{formatCategoryName(viewingItem.serviceType)}</p>
                            </div>
                            <button onClick={() => setViewingItem(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10">
                            <section>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Snapshot</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status</div>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${viewingItem.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                            <span className="font-bold text-slate-900">{viewingItem.isActive ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Base Price</div>
                                        <div className="text-lg font-black text-slate-900 italic">₹{Number(getPrice(viewingItem)).toLocaleString()}</div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Full Specifications</h3>
                                <div className="space-y-4">
                                    {Object.entries(viewingItem).map(([key, value]) => {
                                        if (['_id', 'serviceType', 'isActive', 'vendor', 'vendorId', 'photos', '__v', 'createdAt', 'updatedAt'].includes(key)) return null;
                                        if (typeof value === 'object' && value !== null) {
                                            return (
                                                <div key={key} className="p-6 border border-slate-100 rounded-2xl space-y-4">
                                                    <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">{key}</h4>
                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                                        {Object.entries(value).map(([k, v]) => (
                                                            <div key={k}>
                                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{k.replace(/([A-Z])/g, ' $1')}</div>
                                                                <div className="text-[13px] font-bold text-slate-900">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v || 'N/A')}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={key} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 px-2">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                <span className="text-[13px] font-black text-slate-900">{value === true ? 'Yes' : value === false ? 'No' : String(value)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {viewingItem.photos?.length > 0 && (
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Gallery</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {viewingItem.photos.map((photo, i) => (
                                            <div key={i} className="aspect-video rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
                                                {photo.url && <img src={photo.url} alt={`Photo ${i}`} className="w-full h-full object-cover" />}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={() => {
                                    toggleStatus(viewingItem);
                                    setViewingItem(null);
                                }}
                                className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all shadow-lg ${viewingItem.isActive ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'}`}
                            >
                                {viewingItem.isActive ? 'Deactivate this service' : 'Activate this service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
