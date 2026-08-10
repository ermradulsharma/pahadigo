'use client';

import { useState } from 'react';
import api from '@/core/Api/index.js';
import { useToast } from '@/components/ui/ToastContext.js';
import CyberTable from '@/components/admin/CyberTable.js';
import { Wallet, Search, ArrowRightLeft, DollarSign, Building2, Phone, Coins, ExternalLink, User, ReceiptText, Landmark } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PaymentsClientWrapper({ initialPayments }) {
  const [payments, setPayments] = useState(initialPayments);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingPayout, setProcessingPayout] = useState(null);
  const toast = useToast();
  const router = useRouter();

  const handleMarkPayout = async (bookingId) => {
    if (!confirm("Confirm fund transfer sequence to vendor's node? This will mark the settlement as FINAL.")) return;

    setProcessingPayout(bookingId);
    try {
      const data = await api.admin.payments.payout({ bookingId });
      if (data.success) {
          toast("Settlement Vector Finalized.", "success");
          router.refresh(); // Refresh Server Component to fetch new list
          try {
              const hist = await api.admin.payments.getHistory();
              if (hist.success) setPayments(hist.data.payments || hist.data.history || []);
          } catch(e) {}
      } else {
          toast(data.error || "Terminal Fault marking payout.", "error");
      }
    } catch (error) {
      toast(error.message || "Terminal Fault marking payout.", "error");
    } finally {
      setProcessingPayout(null);
    }
  };

  const columns = [
    {
      header: 'Reference Vector',
      accessor: '_id',
      render: (p) => (
        <div className="flex flex-col gap-1">
          <div className="font-mono text-xs font-bold text-indigo-400 uppercase tracking-tighter">
            {p.bookingCode || p._id.slice(-8).toUpperCase()}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {new Date(p.createdAt).toLocaleString()}
          </div>
        </div>
      )
    },
    {
      header: 'Service Item',
      render: (p) => (
        <div className="flex flex-col items-start gap-1">
          <div className="font-bold text-slate-200 text-sm truncate max-w-[180px]">
            {p.item?.title}
          </div>
          <div className="flex gap-1">
            {p.item?.itemType && (
              <span className="text-[8px] font-mono font-bold text-indigo-400 uppercase border border-indigo-500/20 bg-indigo-500/5 px-1 rounded">
                {p.item.itemType}
              </span>
            )}
            <span className="text-[8px] font-mono font-bold text-slate-400 uppercase border border-white/10 bg-white/5 px-1 rounded">
              {(p.occupancy?.adults || 0) + (p.occupancy?.children || 0)} GUESTS
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Payout Amount',
      render: (p) => (
        <div className="flex flex-col gap-1">
          <div className="font-mono text-emerald-400 text-sm font-bold flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-emerald-500/70" />
            ₹{(p.payout?.status === 'paid' ? (p.payout?.amount || 0) : (p.pricing?.subTotal || p.pricing?.basePrice || 0)).toLocaleString()}
          </div>
          <div className={`text-[8px] font-mono font-bold uppercase tracking-[0.2em] px-1 py-0.5 border rounded-sm w-fit ${p.payout?.status === 'paid' ? 'text-emerald-500/80 border-emerald-500/10 bg-emerald-500/5' : 'text-amber-400 border-amber-500/10 bg-amber-500/5'}`}>
            {p.payout?.status === 'paid' ? 'SETTLED' : 'PENDING'}
          </div>
        </div>
      )
    },
    {
      header: 'Service Partner',
      render: (p) => (
        <div className="flex flex-col gap-1.5">
          <div className="font-bold text-indigo-300 text-[11px] uppercase tracking-wider flex items-center gap-2">
            <div className="p-1 bg-indigo-500/10 rounded"><User className="w-3 h-3" /></div>
            {p.vendor?.businessName}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono italic">
            {p.vendor?._id ? `UID_${p.vendor._id.slice(-6).toUpperCase()}` : '-'}
          </div>
        </div>
      )
    },
    {
      header: 'Audit & Nodes',
      render: (p) => (
        <div className="flex items-center gap-2">
          {p.payout?.status !== 'paid' && p.status !== 'cancelled' ? (
            <button
              onClick={() => handleMarkPayout(p._id)}
              disabled={processingPayout === p._id}
              className="p-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-none transition-all disabled:opacity-20"
              title="Execution Settlement"
            >
              <Coins className={`w-3.5 h-3.5 ${processingPayout === p._id ? 'animate-spin' : ''}`} />
            </button>
          ) : null}

          <div className="group/bank relative">
            <button className="p-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-none transition-all" title="Inspect Bank Credentials">
              <Landmark className="w-3.5 h-3.5" />
            </button>

            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 p-4 bg-[#0a0a0c] border border-white/10 rounded-lg shadow-2xl opacity-0 invisible group-hover/bank:opacity-100 group-hover/bank:visible transition-all duration-200 z-[110] w-64 backdrop-blur-md">
              <div className="text-[10px] font-mono space-y-3">
                <div className="text-slate-500 text-[8px] uppercase tracking-[0.2em] border-b border-white/5 pb-2 mb-2 font-bold flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.payout?.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                  {p.payout?.status === 'paid' ? 'DISBURSED DATA ARCHIVE' : 'SETTLEMENT DESTINATION NODE'}
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-tighter mb-0.5">Account Holder</div>
                    <div className="text-amber-200 font-bold uppercase truncate">
                      {p.payout?.status === 'paid' ? p.payout?.bankDetails?.accountHolderName : p.vendor?.bankDetails?.accountHolderName || 'N/A'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <div>
                      <div className="text-[8px] text-slate-500 uppercase tracking-tighter mb-0.5">Account No</div>
                      <div className="text-slate-200 font-bold tracking-widest">
                        {p.payout?.status === 'paid' ? p.payout?.bankDetails?.accountNumber : p.vendor?.bankDetails?.accountNumber || '••••••••'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[8px] text-slate-500 uppercase tracking-tighter mb-0.5">IFSC Code</div>
                      <div className="text-slate-200 font-bold tracking-widest uppercase">
                        {p.payout?.status === 'paid' ? p.payout?.bankDetails?.ifscCode : p.vendor?.bankDetails?.ifscCode || '••••'}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[8px] text-slate-500 uppercase tracking-tighter mb-0.5">Bank Institution</div>
                    <div className="text-slate-400 font-bold uppercase">
                      {p.payout?.status === 'paid' ? p.payout?.bankDetails?.bankName : p.vendor?.bankDetails?.bankName || 'System Gateway'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute left-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-l-[#0a0a0c]"></div>
            </div>
          </div>

          <Link
            href={`/admin/bookings/${p._id}`}
            className="p-1 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 rounded-none transition-all"
            title="Inspect Source Record"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Wallet className="w-7 h-7 text-indigo-400 opacity-80" /> Financial Console
          </h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-1">Vendor Payouts & Settlement Hub</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <input
              type="text"
              placeholder="Scan Partners..."
              className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none text-sm text-slate-200 w-64 md:w-65 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600 font-mono"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <CyberTable
        data={payments}
        columns={columns}
        itemsPerPage={10}
        searchTerm={searchQuery}
        searchKeys={['vendor.businessName', 'vendor.ownerName', 'vendor.phone', '_id', 'bookingCode']}
        emptyText="NULL OUTPUT: No payout records found in the current audit."
        exportFilename="vendor_payouts_ledger"
      />
    </div>
  );
}
