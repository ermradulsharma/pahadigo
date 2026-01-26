'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '../../../helpers/authUtils';

export default function VendorsPage() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

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
        } catch (e) { console.error(e); }
        return [];
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
        <>
            <header className="bg-white shadow p-6 mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Vendor Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Review and approve vendor accounts</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                    Total: {vendors.length}
                </div>
            </header>

            <div className="px-8 pb-8">
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4 font-semibold">Business Info</th>
                                <th className="p-4 font-semibold">Contact</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Bank Details</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {vendors.map(v => (
                                <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{v.businessName || 'Unnamed Business'}</div>
                                        <div className="text-xs text-gray-500">ID: {v._id}</div>
                                        {!v.hasProfile && (
                                            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded">Profile Pending</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            {v.user?.email || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700 mt-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            {v.user?.phone || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {v.isApproved ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                                Pending Review
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-xs">
                                        {v.bankDetails?.accountNumber ? (
                                            <div className="space-y-1">
                                                <div className="text-gray-900 font-medium">{v.bankDetails.bankName}</div>
                                                <div className="text-gray-500">Acc: •••• {v.bankDetails.accountNumber.slice(-4)}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Not added</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end">
                                            <Link
                                                href={`/admin/vendors/${v._id}`}
                                                className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${v.hasProfile
                                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100'
                                                    }`}
                                            >
                                                <span>{v.hasProfile ? 'Review & Approve' : 'View User Info'}</span>
                                                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
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
            </div>
        </>
    );
}
