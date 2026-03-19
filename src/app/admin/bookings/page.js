'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/helpers/authUtils';

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [processingRefund, setProcessingRefund] = useState(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/bookings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setBookings(data.data.bookings || []);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefund = async (bookingId) => {
        if (!confirm("Are you sure you want to process a full refund for this booking? This action cannot be easily undone.")) return;
        
        setProcessingRefund(bookingId);
        try {
            const token = getToken();
            const res = await fetch('/api/admin/refund', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ bookingId })
            });
            const data = await res.json();
            if (data.success) {
                alert("Refund processed successfully!");
                // Update local status
                setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled', paymentStatus: 'refunded' } : b));
            } else {
                alert("Refund Failed: " + (data.error || data.message || "Unknown error"));
            }
        } catch (error) {
            alert("Error processing refund. Check server logs.");
        } finally {
            setProcessingRefund(null);
        }
    };

    const filteredBookings = bookings.filter(b => {
        if (filterStatus === 'all') return true;
        return b.status === filterStatus;
    });

    const getStatusBadge = (status) => {
        switch(status) {
            case 'confirmed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-black uppercase tracking-wider">Confirmed</span>;
            case 'pending': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-[10px] font-black uppercase tracking-wider">Pending</span>;
            case 'cancelled': return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-[10px] font-black uppercase tracking-wider">Cancelled</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-black uppercase tracking-wider">{status}</span>;
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Booking Console & Refunds</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex gap-2">
                        <select 
                            className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="p-5">Booking ID & Date</th>
                                <th className="p-5">Traveller Info</th>
                                <th className="p-5">Package Details</th>
                                <th className="p-5">Amount</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/80">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">Loading bookings data...</td>
                                </tr>
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                            <span className="text-sm font-bold uppercase tracking-widest">No Bookings Found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBookings.map((booking) => (
                                    <tr key={booking._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-5">
                                            <div className="font-mono text-xs font-bold text-indigo-600 mb-1">{booking._id.slice(-8).toUpperCase()}</div>
                                            <div className="text-[11px] font-bold text-slate-400">{new Date(booking.createdAt).toLocaleString()}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-slate-800 text-sm">{booking.user?.name || 'Guest User'}</div>
                                            <div className="text-xs text-slate-500 font-medium">{booking.user?.email || 'No email provided'}</div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-slate-800 text-sm">{booking.serviceDetails?.title || booking.serviceType || 'Package'}</div>
                                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1 border border-slate-200 inline-block px-1.5 py-0.5 rounded">
                                                {booking.serviceType}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-black text-slate-900">₹{(booking.pricing?.totalPrice || booking.totalAmount || 0).toLocaleString()}</div>
                                            <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${booking.paymentStatus === 'paid' ? 'text-emerald-500' : booking.paymentStatus === 'refunded' ? 'text-indigo-500' : 'text-amber-500'}`}>
                                                {booking.paymentStatus}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            {getStatusBadge(booking.status)}
                                        </td>
                                        <td className="p-5 text-right">
                                            {booking.paymentStatus === 'paid' && booking.status !== 'cancelled' ? (
                                                <button 
                                                    onClick={() => handleRefund(booking._id)}
                                                    disabled={processingRefund === booking._id}
                                                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm
                                                        ${processingRefund === booking._id 
                                                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                                                            : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'}`}
                                                >
                                                    {processingRefund === booking._id ? 'Processing...' : 'Issue Refund'}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    No Actions
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
