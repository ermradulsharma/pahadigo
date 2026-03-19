'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/helpers/authUtils';

export default function VendorPayoutsPage() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterVendor, setFilterVendor] = useState('');
    const [processingPayout, setProcessingPayout] = useState(null);

    useEffect(() => {
        fetchPaymentHistory();
    }, []);

    const fetchPaymentHistory = async () => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/payment-history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                // Determine structure based on how AdminController returns it
                setPayments(data.data.payments || data.data.history || []);
            }
        } catch (error) {
            console.error("Error fetching payment history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPayout = async (bookingId) => {
        if (!confirm("Confirm you have transferred the funds to the vendor's bank account before marking this payout as complete. Proceed?")) return;
        
        setProcessingPayout(bookingId);
        try {
            const token = getToken();
            const res = await fetch('/api/admin/payout', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ bookingId })
            });
            const data = await res.json();
            if (data.success) {
                alert("Vendor payout marked successfully!");
                // Update local state by removing or updating the entry
                fetchPaymentHistory();
            } else {
                alert("Failed: " + (data.error || data.message || "Unknown error"));
            }
        } catch (error) {
            alert("Error marking payout. Check server logs.");
        } finally {
            setProcessingPayout(null);
        }
    };

    const filteredPayments = payments.filter(payment => {
        if (!filterVendor) return true;
        const vendorName = payment.vendorId?.name || payment.vendorId?.businessName || '';
        return vendorName.toLowerCase().includes(filterVendor.toLowerCase());
    });

    const getStatusBadge = (status) => {
        switch(status) {
            case 'paid': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-[10px] font-black uppercase tracking-wider">Settled</span>;
            case 'pending': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-[10px] font-black uppercase tracking-wider">Wait for Payout</span>;
            case 'cancelled': return <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-[10px] font-black uppercase tracking-wider">Cancelled</span>;
            case 'refunded': return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-[10px] font-black uppercase tracking-wider">Refunded to User</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[10px] font-black uppercase tracking-wider">{status}</span>;
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Vendor Payouts Console</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="relative w-72">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Filter by Vendor Name..." 
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={filterVendor}
                            onChange={(e) => setFilterVendor(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="p-5">Txn / Booking ID</th>
                                <th className="p-5">Vendor Info</th>
                                <th className="p-5">Platform Fees</th>
                                <th className="p-5">Net Payable</th>
                                <th className="p-5">Status</th>
                                <th className="p-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/80">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">Loading payout data...</td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span className="text-sm font-bold uppercase tracking-widest">No Payout Records Found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => {
                                    // Calculating mockup commission if actual object does not hold pure payload schema right away
                                    const totalAmount = payment.pricing?.totalPrice || payment.totalAmount || 0;
                                    const platformFee = Math.round(totalAmount * 0.10); // Example 10%
                                    const vendorReceives = totalAmount - platformFee;
                                    
                                    return (
                                        <tr key={payment._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-5">
                                                <div className="font-mono text-xs font-bold text-indigo-600 mb-1">{payment._id.slice(-8).toUpperCase()}</div>
                                                <div className="text-[11px] font-bold text-slate-400">{new Date(payment.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="p-5">
                                                <div className="font-bold text-slate-800 text-sm">{payment.vendor?.businessName || 'Business Name'}</div>
                                                <div className="text-xs text-slate-500 font-medium">{payment.vendor?.phone || 'No Phone Number'}</div>
                                            </td>
                                            <td className="p-5">
                                                <div className="font-semibold text-rose-500 line-through decoration-rose-200">₹{totalAmount.toLocaleString()}</div>
                                                <div className="text-[11px] font-bold text-rose-600 mt-1">- 10% (₹{platformFee.toLocaleString()}) Fee</div>
                                            </td>
                                            <td className="p-5">
                                                <div className="text-lg font-black text-emerald-600">₹{vendorReceives.toLocaleString()}</div>
                                            </td>
                                            <td className="p-5">
                                                {getStatusBadge(payment.paymentStatus)}
                                            </td>
                                            <td className="p-5 text-right">
                                                {payment.paymentStatus === 'pending' && payment.status !== 'cancelled' ? (
                                                    <button 
                                                        onClick={() => handleMarkPayout(payment._id)}
                                                        disabled={processingPayout === payment._id}
                                                        className={`px-4 py-2 text-[11px] uppercase tracking-widest font-black rounded-xl transition-all shadow-sm
                                                            ${processingPayout === payment._id 
                                                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                                                                : 'bg-indigo-600 border border-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'}`}
                                                    >
                                                        {processingPayout === payment._id ? 'Working...' : 'Mark as Paid'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        Settled
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
