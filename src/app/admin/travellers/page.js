'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getToken } from '../../../helpers/authUtils';

export default function TravellersPage() {
    const [travellers, setTravellers] = useState([]);
    const [loading, setLoading] = useState(true);

    const getTravellers = useCallback(async () => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/travellers', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                const data = await res.json();
                return data.data?.travellers || []; // Adjusted for response format
            }
            return [];
        } catch (e) { }
    }, []);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            const data = await getTravellers();
            if (mounted) {
                setTravellers(data);
                setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [getTravellers]);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Travellers...</div>;

    return (
        <>
            <header className="bg-white shadow p-6 mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Traveller Management</h1>
                    <p className="text-gray-500 text-sm mt-1">View and manage registered travellers</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                    Total: {travellers.length}
                </div>
            </header>

            <div className="px-8 pb-8">
                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-4 font-semibold">Traveller Name</th>
                                <th className="p-4 font-semibold">Contact Info</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Joined Date</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {travellers.map(t => (
                                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{t.name || 'Anonymous User'}</div>
                                        <div className="text-xs text-gray-500">ID: {t._id}</div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            {t.email || 'N/A'}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-700 mt-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            {t.phone || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${t.status === 'active'
                                            ? 'bg-green-100 text-green-800 border-green-200'
                                            : 'bg-gray-100 text-gray-800 border-gray-200'
                                            }`}>
                                            {t.status || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition">
                                                Edit
                                            </button>
                                            <button className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm font-medium hover:bg-red-100 transition">
                                                Block
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {travellers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">No travellers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
