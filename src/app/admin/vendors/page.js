'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '@/helpers/authUtils';

export default function VendorsPage() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Add Vendor Modal State
    const [addLoading, setAddLoading] = useState(false);
    const [newVendor, setNewVendor] = useState({
        businessName: '',
        ownerName: '',
        email: '',
        phone: '',
        password: ''
    });

    const handleAddVendor = async (e) => {
        e.preventDefault();
        setAddLoading(true);
        try {
            const token = getToken();
            const res = await fetch('/api/admin/vendors', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(newVendor)
            });
            const data = await res.json();
            if (data.success) {
                alert("Vendor Added Successfully!");
                setIsModalOpen(false);
                setNewVendor({ businessName: '', ownerName: '', email: '', phone: '', password: '' });
                // Re-fetch vendors
                const updated = await getVendors();
                setVendors(updated);
            } else {
                alert("Failed: " + (data.error || data.message));
            }
        } catch (error) {
            alert("An error occurred.");
        } finally {
            setAddLoading(false);
        }
    };

    const getVendors = useCallback(async () => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/vendors', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                const data = await res.json();
                return data.data?.vendors || [];
            }
            return [];
        } catch (e) { }
    }, []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const data = await getVendors();
            if (mounted) {
                setVendors(data);
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [getVendors]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Vendors...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Vendor Management</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Search vendors..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        <span>Add Vendor</span>
                    </button>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-4 font-semibold w-1/4">Name</th>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Phone</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {vendors.map(v => (
                            <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-bold text-gray-900">{v.user?.name || 'No Name'}</div>
                                    {!v.hasProfile && (
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">No Business Profile</span>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-gray-700">
                                    {v.user?.email || 'N/A'}
                                </td>
                                <td className="p-4 text-sm text-gray-700">
                                    {v.user?.phone || 'N/A'}
                                </td>
                                <td className="p-4">
                                    {v.hasProfile && v.isApproved ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                            Verified
                                        </span>
                                    ) : v.hasProfile && !v.isApproved ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                            Pending Approval
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                            Incomplete Sign Up
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-3 items-center">
                                        {/* View Business Profile Icon */}
                                        <Link href={`/admin/vendors/${v._id}`} title="View Business Profile" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                        </Link>

                                        {/* View Packages Icon */}
                                        <Link href={`/admin/packages/${v._id}`} title="View Vendor Packages" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {vendors.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-8 text-center text-gray-500">No vendors found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Vendor Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">Add New Vendor</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleAddVendor} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Business Name *</label>
                                    <input type="text" required value={newVendor.businessName} onChange={e => setNewVendor({...newVendor, businessName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Travel Agency Pvt Ltd" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Owner Name</label>
                                    <input type="text" value={newVendor.ownerName} onChange={e => setNewVendor({...newVendor, ownerName: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Email Address *</label>
                                    <input type="email" required value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="contact@agency.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Phone Number *</label>
                                    <input type="tel" required value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="+91 9876543210" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">Login Password *</label>
                                    <input type="password" required value={newVendor.password} onChange={e => setNewVendor({...newVendor, password: e.target.value})} className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Secret@123" />
                                </div>
                                
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm">Cancel</button>
                                    <button type="submit" disabled={addLoading} className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl transition-all shadow-sm text-sm ${addLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'}`}>
                                        {addLoading ? 'Creating...' : 'Add Vendor'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
