'use client';

import { useState } from 'react';
import api from '@/core/Api/index.js';
import { useToast } from '@/components/ui/ToastContext.js';
import CyberTable from '@/components/admin/CyberTable.js';
import { Calendar, Search, CreditCard, Mail, ExternalLink, Undo2, Eye, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function BookingsClientWrapper({ initialBookings, initialTotalMetadata }) {
    const [bookings, setBookings] = useState(initialBookings);
    const [totalMetadata, setTotalMetadata] = useState(initialTotalMetadata);
    
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const filterStatus = searchParams.get('status') || 'all';
    const currentPage = parseInt(searchParams.get('page') || '1');
    const [searchQuery, setSearchQuery] = useState('');
    const [processingRefund, setProcessingRefund] = useState(null);
    const toast = useToast();

    // Push new URL params to trigger Server Component re-fetch
    const updateParams = (key, value) => {
        const params = new URLSearchParams(searchParams);
        if (value) params.set(key, value);
        else params.delete(key);
        // Reset page if status changes
        if (key === 'status') params.set('page', '1');
        
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleRefund = async (bookingId, fullAmount) => {
        const reason = prompt("Enter reason for refund:", "Customer requested cancellation");
        if (!reason) return;

        const amountStr = prompt("Enter refund amount:", fullAmount);
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            toast("Invalid amount", "error");
            return;
        }

        setProcessingRefund(bookingId);
        try {
            const data = await api.admin.payments.refund({ bookingId, amount, reason });
            if (data.success) {
                toast("Refund processed successfully!", "success");
                router.refresh();
            } else {
                toast("Refund Failed: " + (data.error || data.message || "Unknown error"), "error");
            }
        } catch (error) {
            toast("Error processing refund.", "error");
        } finally {
            setProcessingRefund(null);
        }
    };

    const handleDownloadPdf = async (bookingId, bookingCode, type = 'traveller') => {
        try {
            const blob = await api.admin.bookings.downloadInvoice(bookingId, type);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Invoice_${type}_${bookingCode || bookingId}.pdf`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            toast(`${type === 'vendor' ? 'Vendor' : 'Traveller'} PDF downloaded successfully!`, "success");
        } catch (error) {
            toast("Failed to download PDF.", "error");
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed': return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">Confirmed</span>;
            case 'pending': return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">Pending</span>;
            case 'refund_pending': return <span className="px-2.5 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(139,92,246,0.1)]">Refund Req</span>;
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
                    <div className="font-mono text-xs font-bold text-indigo-400">{b.bookingCode || b._id.slice(-8).toUpperCase()}</div>
                    <div className="text-[10px] font-mono text-slate-500">{new Date(b.createdAt).toLocaleString()}</div>
                </div>
            )
        },
        {
            header: 'Traveller Info',
            accessor: 'user',
            render: (b) => (
                <div className="flex flex-col gap-1">
                    <div className="font-bold text-slate-200 text-sm">{b.user?.name || b.traveller?.name || 'Guest'}</div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <Mail className="w-3 h-3 text-slate-500" /> {b.user?.email || b.traveller?.email}
                    </div>
                </div>
            )
        },
        {
            header: 'Service Partner',
            accessor: 'vendor',
            render: (b) => (
                <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-indigo-300 text-[11px] uppercase tracking-wider flex items-center gap-2">
                        <div className="p-1 bg-indigo-500/10 rounded"><Calendar className="w-3 h-3" /></div>
                        {b.vendor?.ownerName || 'Admin Operator'}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                        <Search className="w-2.5 h-2.5" /> {b.vendor?.businessName || 'Direct Platform'}
                    </div>
                </div>
            )
        },
        {
            header: 'Service Item',
            accessor: 'item',
            render: (b) => (
                <div className="flex flex-col items-start gap-1">
                    <div className="font-bold text-slate-200 text-sm truncate max-w-[150px]">{b.item?.title || 'Package'}</div>
                    <div className="flex gap-1">
                        <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase border border-indigo-500/20 bg-indigo-500/5 px-1 rounded">{b.item?.itemType}</span>
                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase border border-white/10 bg-white/5 px-1 rounded">{b.occupancy?.units} Units</span>
                    </div>
                </div>
            )
        },
        {
            header: 'Amount',
            accessor: 'pricing.total',
            render: (b) => (
                <div className="group relative flex flex-col gap-1 cursor-help">
                    <div className="font-mono text-emerald-400 text-sm font-bold flex items-center gap-1.5 transition-all group-hover:scale-105">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500/70" />
                        ₹{(b.pricing?.total || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`text-[8px] font-mono font-bold uppercase tracking-[0.2em] px-1 py-0.5 border rounded-sm w-fit ${b.paymentStatus === 'paid' ? 'text-emerald-500/80 border-emerald-500/10 bg-emerald-500/5' : b.paymentStatus === 'refunded' ? 'text-indigo-400 border-indigo-400/10 bg-indigo-500/5' : b.paymentStatus === 'refund_pending' ? 'text-violet-400 border-violet-400/20 bg-violet-500/5' : 'text-amber-400 border-amber-500/10 bg-amber-500/5'}`}>
                            {b.paymentStatus}
                        </div>
                        <div className="group/details relative">
                            <div className={`text-[8px] font-mono font-bold uppercase tracking-[0.2em] px-1 py-0.5 border rounded-sm w-fit text-indigo-400 border-indigo-400/10 bg-indigo-500/5`}>
                                BREAKDOWN
                            </div>
                            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 p-4 bg-[#0a0a0c] border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover/details:opacity-100 group-hover/details:visible transition-all duration-200 z-[100] w-56 backdrop-blur-md">
                                <div className="text-[11px] font-mono space-y-2">
                                    <div className="text-slate-500 text-[9px] uppercase tracking-widest border-b border-white/5 pb-1.5 mb-2 font-bold">Price Breakdown</div>
                                    <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="text-white">₹{(b.pricing?.subTotal || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-indigo-400"><span>Service Fee</span><span>+₹{(b.pricing?.serviceFee || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-rose-400"><span>Discounts</span><span>-₹{((b.pricing?.discount || 0) + (b.pricing?.couponAmount || 0)).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-slate-400"><span>Tax ({b.pricing?.taxRate}%)</span><span className="text-white">₹{(b.pricing?.tax || 0).toLocaleString()}</span></div>
                                    <div className="border-t border-white/10 pt-2 mt-2 flex justify-between text-emerald-400 font-bold text-xs"><span>Total</span><span>₹{(b.pricing?.total || 0).toLocaleString()}</span></div>
                                </div>
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-[#0a0a0c]"></div>
                            </div>
                        </div>
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
            render: (b) => (
                <div className="flex items-center gap-2">
                    <div className="group/details relative">
                        <button className="p-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/40 rounded-none transition-all" title="Inspect Sequence">
                            <Eye className="w-3 h-3" />
                        </button>
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 p-4 bg-[#0a0a0c] border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover/details:opacity-100 group-hover/details:visible transition-all duration-200 z-[110] w-64 backdrop-blur-md">
                            <div className="text-[11px] font-mono space-y-4">
                                <div className="text-slate-500 text-[9px] uppercase tracking-[0.2em] border-b border-white/5 pb-2 mb-3 font-bold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                                    Audit Trail Vector
                                </div>
                                <div className="relative space-y-4 border-l border-indigo-500/20 ml-1.5 pl-4 max-h-64 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-2">
                                    {(b.timeline && b.timeline.length > 0 ? b.timeline : [{ status: 'LOG_INIT', timestamp: b.createdAt, remarks: 'System record initialized.' }]).map((event, idx) => (
                                        <div key={idx} className="relative group/node mb-4 last:mb-0">
                                            <div className="absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full bg-[#0a0a0c] border border-indigo-500/50 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-indigo-400"></div></div>
                                            <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">{event.status || 'EVENT'}</div>
                                            <div className="text-[8px] text-slate-500 mb-1">{new Date(event.timestamp).toLocaleString()}</div>
                                            <p className="text-[9px] text-slate-400 leading-tight bg-white/[0.02] p-1.5 border border-white/5">{event.remarks}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-[#0a0a0c]"></div>
                        </div>
                    </div>
                    <Link href={`/admin/bookings/${b._id}`} className="p-1 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 hover:border-violet-500/40 rounded-none transition-all" title="Navigate to Detail Vector">
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button onClick={() => handleDownloadPdf(b._id, b.bookingCode, 'traveller')} className="p-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/40 rounded-none transition-all" title="Download Traveller Invoice">
                        <Download className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleDownloadPdf(b._id, b.bookingCode, 'vendor')} className="p-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/40 rounded-none transition-all" title="Download Vendor Invoice">
                        <Download className="w-3 h-3" />
                    </button>
                    {['paid', 'refund_pending'].includes(b.paymentStatus) && b.paymentStatus !== 'refunded' && (
                        <button onClick={() => handleRefund(b._id, b.pricing?.total)} disabled={processingRefund === b._id} className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-none transition-all disabled:opacity-30" title="Initiate Termination Sequence">
                            <Undo2 className={`w-3 h-3 ${processingRefund === b._id ? 'animate-spin' : ''}`} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    const filteredBookings = initialBookings.filter(b => {
        // Just client side quick filter if they search
        return true;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><Calendar className="w-7 h-7 text-indigo-400 opacity-80" /> Booking Console</h1>
                    <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">Platform Reservations & Refunds</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative group md:block">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <input type="text" placeholder="Scan Nodes..." className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-sm text-slate-200 w-64 md:w-65 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <div>
                            <select className="px-4 py-2 border border-white/10 rounded-lg text-xs font-mono uppercase tracking-widest text-indigo-300 outline-none focus:ring-1 focus:ring-indigo-500 bg-[#111116] shadow-[0_0_15px_rgba(0,0,0,0.5)]" value={filterStatus} onChange={(e) => updateParams('status', e.target.value)}>
                                <option value="all" className="bg-[#111116]">All Status</option>
                                <option value="confirmed" className="bg-[#111116]">Confirmed</option>
                                <option value="pending" className="bg-[#111116]">Pending</option>
                                <option value="cancelled" className="bg-[#111116]">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <CyberTable data={filteredBookings} columns={columns} itemsPerPage={10} totalItems={totalMetadata.total} externalCurrentPage={currentPage} onPageChange={(page) => updateParams('page', String(page))} searchTerm={searchQuery} searchKeys={['user.name', 'user.email', 'vendor.businessName', 'vendor.ownerName', '_id', 'serviceDetails.title', 'serviceType']} emptyText="No bookings found in database." exportFilename="bookings_data" />
        </div>
    );
}
