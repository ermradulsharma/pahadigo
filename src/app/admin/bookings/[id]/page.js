'use client';
import { useState, useEffect, use } from 'react';
import { getToken } from '@/helpers/authUtils';
import {
  ArrowLeft, Calendar, User, ShieldCheck, CreditCard,
  MapPin, Clock, FileText, CheckCircle2, AlertCircle,
  ExternalLink, Undo2, RefreshCcw, Mail, Phone,
  ChevronRight, BadgeCheck, Hash
} from 'lucide-react';
import Link from 'next/link';

export default function BookingDetailPage({ params }) {
  const { id } = use(params);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingRefund, setProcessingRefund] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const handleSendInvoice = async () => {
    if (!confirm("Execute Invoice Dispatch Sequence to Traveller and Vendor?")) return;

    setSendingInvoice(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/bookings/${id}/invoice`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert("Transmission Successful: Invoice Dispatched.");
        fetchBooking();
      } else {
        alert("Transmission Error: " + (data.error || "Unknown Failure"));
      }
    } catch (error) {
      alert("Hardware/Network Failure during dispatch.");
    } finally {
      setSendingInvoice(false);
    }
  };

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/bookings/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBooking(data.data.booking);
      }
    } catch (error) {
      console.error("Error fetching booking detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (amount) => {
    const reason = prompt("Enter reason for refund:", "Internal system adjustment");
    if (!reason) return;

    setProcessingRefund(true);
    try {
      const token = getToken();
      const res = await fetch('/api/admin/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: id, amount, reason })
      });
      const data = await res.json();
      if (data.success) {
        alert("Refund Sequence Executed Successfully.");
        fetchBooking();
      } else {
        alert("Execution Error: " + (data.error || "Matrix Failure"));
      }
    } catch (err) {
      alert("Terminal Error processing refund.");
    } finally {
      setProcessingRefund(false);
    }
  };

  if (loading) return (
    <div className="p-8 h-screen flex flex-col items-center justify-center space-y-4 bg-[#0a0a0c]">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-emerald-500 animate-spin-reverse opacity-70"></div>
        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
      </div>
      <div className="text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase animate-pulse">Accessing Encrypted Record...</div>
    </div>
  );

  if (!booking) return (
    <div className="p-8 h-screen flex flex-col items-center justify-center bg-[#0a0a0c]">
      <AlertCircle className="w-12 h-12 text-rose-500 mb-4 opacity-20" />
      <div className="text-sm font-mono text-slate-500 uppercase tracking-widest">ERROR: Node [{id}] Not Found in Database.</div>
      <Link href="/admin/bookings" className="mt-6 text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors uppercase border-b border-indigo-500/20 pb-1 flex items-center gap-2">
        <ArrowLeft className="w-3 h-3" /> Return to Command Console
      </Link>
    </div>
  );

  return (
    <div className="p-8 min-h-screen bg-[#0a0a0c] text-slate-200">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/admin/bookings" className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all group">
                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight uppercase text-white flex items-center gap-3 lowercase">
                  <span className="opacity-40 select-none">#</span> {booking.bookingCode || booking._id}
                </h1>
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mt-1">
                  Reservation Matrix • Logged {new Date(booking.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-1.5 rounded-none border font-mono text-[10px] uppercase tracking-[0.2em] shadow-lg ${booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
              booking.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
              {booking.status}
            </div>

            {['paid', 'refund_pending'].includes(booking.paymentStatus) && booking.status !== 'cancelled' && (
              <button
                onClick={() => handleRefund(booking.pricing.total)}
                disabled={processingRefund}
                className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-none text-[10px] font-mono uppercase tracking-widest transition-all h-full"
              >
                {processingRefund ? 'Executing...' : 'Terminate & Refund'}
              </button>
            )}

            <button
              onClick={handleSendInvoice}
              disabled={sendingInvoice}
              className={`p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-none transition-all ${sendingInvoice ? 'animate-pulse opacity-50' : ''}`}
              title="Generate & Send Official Invoice"
            >
              {sendingInvoice ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Section 1: Traveller Identity */}
          <div className="bg-[#0f0f13] border border-white/5 p-6 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <User className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <User className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Traveller Node</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase text-slate-500 font-mono tracking-tighter">Primary Contact</div>
                <div className="text-lg font-bold text-white">{booking.user?.name || booking.traveller?.name}</div>
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-indigo-500/50" /> {booking.user?.email || booking.traveller?.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-indigo-500/50" /> {booking.user?.phone || booking.traveller?.phone || 'N/A'}
                  </div>
                </div>
              </div>

              {booking.occupancy?.guestDetails?.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <div className="text-[10px] uppercase text-slate-500 font-mono tracking-tighter">Co-Travellers ({booking.occupancy.guestDetails.length})</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                    {booking.occupancy.guestDetails.map((guest, i) => (
                      <div key={i} className="bg-white/5 p-3 flex justify-between items-center text-xs border-l-2 border-indigo-500/20">
                        <span className="font-bold text-slate-300">{guest.name}</span>
                        <span className="text-slate-500 font-mono text-[9px] uppercase tracking-widest">{guest.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Service Matrix */}
          <div className="bg-[#0f0f13] border border-white/5 p-6 space-y-6 relative overflow-hidden group md:col-span-2">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="w-12 h-12" />
            </div>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Service Compliance</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-mono tracking-tighter mb-1">Service Entity</div>
                  <div className="text-xl font-bold bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                    {booking.item?.title || 'System Package'}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono uppercase font-bold tracking-[0.2em]">{booking.item?.itemType}</span>
                    <span className="px-2 py-0.5 bg-white/5 text-slate-400 border border-white/10 text-[9px] font-mono uppercase font-bold tracking-[0.2em]">{booking.occupancy?.adults + booking.occupancy?.children} Total Pax</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-white/5 p-3 bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase mb-1"><Clock className="w-3 h-3" /> Check-In</div>
                    <div className="text-sm font-bold text-white uppercase">{new Date(booking.startDate).toLocaleDateString()}</div>
                  </div>
                  <div className="border border-white/5 p-3 bg-white/[0.02]">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase mb-1"><Clock className="w-3 h-3 rotate-180" /> Check-Out</div>
                    <div className="text-sm font-bold text-white uppercase">{new Date(booking.endDate).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 border-l border-white/5 pl-8">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-mono tracking-tighter mb-2">Fulfillment Partner</div>
                  <div className="p-4 bg-[#0a0a0c] border border-indigo-500/10 space-y-3">
                    <div className="font-bold text-indigo-300 flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4 text-indigo-400" />
                      {booking.vendor?.businessName}
                    </div>
                    <div className="text-xs text-slate-400 font-mono leading-relaxed">
                      {booking.vendor?.ownerName} (UID: {booking.vendor?._id?.slice(-8).toUpperCase()})
                    </div>
                    <div className="flex gap-4 pt-2 border-t border-white/5">
                      <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> CONTACT</div>
                      <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> SUPPORT</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Financial Core */}
          <div className="bg-[#0f0f13] border border-white/5 p-6 space-y-6 relative overflow-hidden group">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Financial Audit</h2>
            </div>

            <div className="space-y-4">
              <div className="text-3xl font-mono font-black text-emerald-400 flex items-baseline gap-2">
                <span className="text-sm font-normal opacity-50">₹</span>
                {booking.pricing.total.toLocaleString()}
              </div>

              <div className="space-y-2.5 pt-4 border-t border-white/5">
                {[
                  { label: 'Subtotal Net', val: booking.pricing.subTotal },
                  { label: 'Platform Fee', val: booking.pricing.serviceFee, color: 'text-indigo-400' },
                  { label: 'Taxation Module', val: booking.pricing.tax },
                  { label: 'Coupon Discount', val: -(booking.pricing.discount || 0 + booking.pricing.couponAmount || 0), color: 'text-rose-400' }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px] font-mono uppercase tracking-[0.1em]">
                    <span className="text-slate-500">{item.label}</span>
                    <span className={item.color || 'text-slate-200'}>{item.val > 0 && item.color !== 'text-rose-400' ? '+' : ''}₹{Math.abs(item.val).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 space-y-4">
                <div className="text-[10px] font-mono text-slate-600 border-b border-white/5 pb-2 uppercase tracking-widest flex justify-between">
                  <span>Gateway Link</span>
                  <span>{booking.payment.gateway}</span>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-black/40 border border-white/5 space-y-2">
                    <div className="text-[9px] text-slate-500 font-mono tracking-tighter uppercase">Transaction ID</div>
                    <div className="text-[11px] font-mono font-bold tracking-widest text-indigo-400 truncate break-all">{booking.payment.paymentId || 'NO_TX_LINKED'}</div>
                  </div>
                  <div className="p-3 bg-black/40 border border-white/5 space-y-2">
                    <div className="text-[9px] text-slate-500 font-mono tracking-tighter uppercase">Gateway Order</div>
                    <div className="text-[11px] font-mono font-bold tracking-widest text-slate-400 truncate break-all">{booking.payment.orderId || 'PENDING'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Operational Data (Security & Audit) */}
          <div className="bg-[#0f0f13] border border-white/5 p-6 space-y-6 relative overflow-hidden group md:col-span-2">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <ShieldCheck className="w-5 h-5 text-violet-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest">Operational Sequence</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* OTP Matrix */}
              <div className="space-y-6">
                <div className="text-[10px] uppercase text-slate-500 font-mono tracking-tighter mb-2">Security Handshakes</div>
                <div className="space-y-4">
                  <div className={`p-4 border-l-4 ${booking.verification?.isStartVerified ? 'border-emerald-500 bg-emerald-500/5' : 'border-amber-500/50 bg-white/[0.02]'} transition-all`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300">Start Handshake</span>
                      {booking.verification?.isStartVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-amber-500/50" />}
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-xl font-mono font-black text-white tracking-[0.3em]">{booking.verification?.startOTP || '••••'}</div>
                      <div className="text-[9px] font-mono text-slate-500 italic">Code Signature</div>
                    </div>
                    {booking.verification?.isStartVerified && (
                      <div className="mt-2 text-[9px] font-mono text-emerald-400 uppercase tracking-widest">Verified {new Date(booking.verification.startVerifiedAt).toLocaleString()}</div>
                    )}
                  </div>

                  <div className={`p-4 border-l-4 ${booking.verification?.isEndVerified ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 bg-white/[0.01]'} transition-all`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">End Handshake</span>
                      {booking.verification?.isEndVerified ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Clock className="w-4 h-4 text-slate-700" />}
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div className="text-xl font-mono font-black text-slate-700 tracking-[0.3em]">{booking.verification?.endOTP || '••••'}</div>
                      <div className="text-[9px] font-mono text-slate-700 italic">Awaiting Closure</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifecycle Feed */}
              <div className="space-y-6">
                <div className="text-[10px] uppercase text-slate-500 font-mono tracking-tighter mb-2">Internal Audit Vector</div>
                <div className="max-h-[300px] overflow-y-auto no-scrollbar relative space-y-4 border-l border-white/5 pl-6 ml-2">
                  {(booking.timeline || [{ status: 'NODE_INIT', timestamp: booking.createdAt, remarks: 'System record created.' }]).map((event, i) => (
                    <div key={i} className="relative group/step pb-4">
                      <div className="absolute -left-[30px] top-1 w-2 h-2 rounded-full border border-indigo-500 bg-[#0a0a0c] z-10"></div>
                      <div className="text-[10px] font-bold text-indigo-300 font-mono uppercase tracking-[0.2em]">{event.status}</div>
                      <div className="text-[8px] text-slate-500 font-mono mb-2">{new Date(event.timestamp).toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400 bg-white/5 p-2 rounded-sm border border-transparent hover:border-white/5 transition-all">
                        {event.remarks || 'No remarks logged.'}
                      </div>
                    </div>
                  ))}
                  {/* <div className="sticky bottom-0 h-12 bg-gradient-to-t from-[#0f0f13] to-transparent pointer-events-none"></div> */}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Technical Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 border-t border-white/5 bg-[#0a0a0c]">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Internal ID</span>
              <span className="text-[11px] font-mono text-slate-300 uppercase letter-spacing-2 select-all">{booking._id}</span>
            </div>
            <div className="h-8 w-px bg-white/5"></div>
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Global Status</span>
              <span className="text-[11px] font-mono text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <RefreshCcw className="w-3 h-3 animate-spin" /> Node Synchronized
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 transition-all text-xs font-mono uppercase border border-white/5">
              <Hash className="w-3.5 h-3.5 opacity-40" /> Trace Metadata
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white transition-all text-xs font-mono uppercase font-bold shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              Update Record <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
