'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/helpers/authUtils';

export default function InventoryPage() {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/packages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPackages(data.data.packages);
            }
        } catch (error) {
            console.error("Failed to fetch packages:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const filteredPackages = packages.filter(pkg => {
        const matchesSearch = (pkg.trekkingName || pkg.roomType || pkg.stretchName || pkg.jumpName || pkg.model || pkg.tourName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pkg.vendor?.businessName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || pkg.serviceType === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const getServiceName = (pkg) => {
        // Try to find a title/name in common fields across all service types
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
        // Handle varied pricing structures across types
        return pkg.pricing?.pricePerPerson ||
            pkg.pricing?.pricePerNight ||
            pkg.pricing?.pricePerDay ||
            pkg.pricing?.baseFare ||
            0;
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-50 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 min-w-[300px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search by name or vendor..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        <option value="homestay">Homestays</option>
                        <option value="trekking">Trekking</option>
                        <option value="rafting">Rafting</option>
                        <option value="bungeeJumping">Bungee Jumping</option>
                        <option value="vehicleRental">Vehicle Rental</option>
                        <option value="chardhamTour">Chardham Tour</option>
                        <option value="camping">Camping</option>
                        <option value="customTrip">Custom Trip</option>
                        <option value="skiing">Skiing</option>
                        <option value="paragliding">Paragliding</option>
                    </select>
                </div>

                {/* Content Grid */}
                <div className="p-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="bg-slate-50 h-[380px] rounded-3xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : filteredPackages.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPackages.map((pkg) => (
                                <div key={`${pkg._id}-${pkg.serviceType}`} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col">
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
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${pkg.isActive ? 'bg-emerald-500/90 text-white' : 'bg-rose-500/90 text-white'}`}>
                                                {pkg.isActive ? 'Live' : 'Hidden'}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-4 left-4">
                                            <span className="px-2 py-1 bg-indigo-600 text-white rounded text-[9px] font-black uppercase tracking-widest">
                                                {pkg.serviceType}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="mb-4">
                                            <h3 className="font-black text-slate-900 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{getServiceName(pkg)}</h3>
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                                <span className="line-clamp-1">{typeof pkg.location === 'object' ? pkg.location?.address : (pkg.location || 'Standard Location')}</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Vendor</div>
                                                <div className="text-xs font-black text-slate-700 truncate max-w-[120px]">{pkg.vendor?.businessName || 'Unknown'}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Base Price</div>
                                                <div className="text-lg font-black text-slate-900">₹{getPrice(pkg).toLocaleString()}</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => toggleStatus(pkg)}
                                            className={`mt-4 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${pkg.isActive ? 'border-rose-100 text-rose-600 hover:bg-rose-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}
                                        >
                                            {pkg.isActive ? 'Deactivate Service' : 'Activate Service'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            <p className="text-sm font-bold uppercase tracking-widest">No components found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
