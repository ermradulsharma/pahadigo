'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/helpers/authUtils';
import CyberTable from '@/app/components/admin/CyberTable';
import { Calendar, Search, Mail, Phone, CreditCard } from 'lucide-react';

export default function BookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">Confirmed</span>;
            case 'pending': return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">Pending</span>;
            case 'cancelled': return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(244,63,94,0.1)]">Cancelled</span>;
            default: return <span className="px-2.5 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(255,255,255,0.05)]">{status}</span>;
        }
    };

    const columns = [
        {
            header: 'Booking ID & Date',
            accessor: '_id',
            render: (b) => (
                <div className="flex flex-col gap-1">
                    <div className="font-mono text-xs font-bold text-indigo-400">{b._id.slice(-8).toUpperCase()}</div>
                    <div className="text-[10px] font-mono text-slate-500">{new Date(b.createdAt).toLocaleString()}</div>
                </div>
            )
        },
        {
            header: 'Traveller Info',
            accessor: 'user',
            render: (b) => (
                <div className="flex flex-col gap-1">
                    <div className="font-bold text-slate-200 text-sm">{b.user?.name || 'Guest User'}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <Mail className="w-3 h-3 text-slate-500" /> {b.user?.email || 'No email provided'}
                    </div>
                </div>
            )
        },
        {
            header: 'Package Details',
            accessor: 'serviceDetails',
            render: (b) => (
                <div className="flex flex-col items-start gap-1">
                    <div className="font-bold text-slate-200 text-sm line-clamp-1 max-w-[200px]">{b.serviceDetails?.title || b.serviceType || 'Package'}</div>
                    <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest border border-white/10 bg-white/5 px-1.5 py-0.5 rounded">
                        {b.serviceType}
                    </div>
                </div>
            )
        },
        {
            header: 'Amount & Payment',
            accessor: 'totalAmount',
            render: (b) => (
                <div className="flex flex-col gap-1">
                    <div className="font-mono text-emerald-400 text-sm font-bold flex items-center gap-1.5 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">
                        <CreditCard className="w-3 h-3 text-emerald-500 opacity-70" />
                        ₹{(b.pricing?.totalPrice || b.totalAmount || 0).toLocaleString()}
                    </div>
                    <div className={`text-[9px] font-mono font-bold uppercase tracking-widest mt-0.5 ${b.paymentStatus === 'paid' ? 'text-emerald-500' : b.paymentStatus === 'refunded' ? 'text-indigo-500' : 'text-amber-500'}`}>
                        {b.paymentStatus}
                    </div>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (b) => getStatusBadge(b.status)
        },
        {
            header: 'Actions',
            className: 'text-right',
            tdClassName: 'text-right',
            render: (b) => (
                <div className="flex justify-end gap-2">
                    {b.paymentStatus === 'paid' && b.status !== 'cancelled' ? (
                        <button onClick={() => handleRefund(b._id)} disabled={processingRefund === b._id} className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${processingRefund === b._id ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`}>
                            {processingRefund === b._id ? 'Processing...' : 'Issue Refund'}
                        </button>
                    ) : (
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            No Actions
                        </span>
                    )}
                </div>
            )
        }
    ];

    if (loading) return (
        <div className="p-8 h-full flex flex-col items-center justify-center space-y-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-r-2 border-emerald-500 animate-spin-reverse opacity-70"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
            </div>
            <div className="text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase animate-pulse">Fetching Booking Records...</div>
        </div>
    );

    const filteredBookings = bookings.filter(b => {
        if (filterStatus === 'all') return true;
        return b.status === filterStatus;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Calendar className="w-7 h-7 text-indigo-400 opacity-80" /> Booking Console
                    </h1>
                    <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-2">Platform Reservations & Refunds</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input type="text" placeholder="Search by ID, User..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <select className="px-4 py-2 border border-white/10 rounded-lg text-xs font-mono uppercase tracking-widest text-indigo-300 outline-none focus:ring-1 focus:ring-indigo-500 bg-[#111116] shadow-[0_0_15px_rgba(0,0,0,0.5)]" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all" className="bg-[#111116]">All Status</option>
                        <option value="confirmed" className="bg-[#111116]">Confirmed</option>
                        <option value="pending" className="bg-[#111116]">Pending</option>
                        <option value="cancelled" className="bg-[#111116]">Cancelled</option>
                    </select>
                </div>
            </div>

            <CyberTable
                data={filteredBookings}
                columns={columns}
                itemsPerPage={10}
                searchTerm={searchQuery}
                searchKeys={['user.name', 'user.email', '_id', 'serviceDetails.title', 'serviceType']}
                emptyText="No bookings found in database."
                exportFilename="bookings_data"
            />
        </div>
    );
}
