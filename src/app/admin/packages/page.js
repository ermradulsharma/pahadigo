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
        return pkg.trekkingName || pkg.roomType || pkg.stretchName || pkg.jumpName || pkg.model || pkg.tourName || 'Unnamed Service';
    };

    const getPrice = (pkg) => {
        return pkg.pricePerPerson || pkg.pricePerNight || pkg.pricePerDay || 0;
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
                    </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Service Name</th>
                                <th className="px-6 py-4 font-semibold">Vendor</th>
                                <th className="px-6 py-4 font-semibold">Category</th>
                                <th className="px-6 py-4 font-semibold">Price</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 italic-rows">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4 h-16 bg-gray-50/50"></td>
                                    </tr>
                                ))
                            ) : filteredPackages.length > 0 ? (
                                filteredPackages.map((pkg) => (
                                    <tr key={`${pkg._id}-${pkg.serviceType}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-800">{getServiceName(pkg)}</div>
                                            <div className="text-xs text-gray-400 capitalize">{pkg.location || 'No location'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {pkg.vendor?.businessName || 'Unknown Vendor'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-tighter">
                                                {pkg.serviceType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                                            ₹{getPrice(pkg).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {pkg.isActive ? 'Active' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleStatus(pkg)}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${pkg.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                            >
                                                {pkg.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400 italic">No services found matching your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
