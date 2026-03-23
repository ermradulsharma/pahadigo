'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/helpers/authUtils';
import CyberTable from '@/app/components/admin/CyberTable';
import { Wallet, Search, ArrowRightLeft, DollarSign, Building2, Phone } from 'lucide-react';

export default function VendorPayoutsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.1)]">Settled</span>;
      case 'pending': return <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)] animate-pulse">Wait for Payout</span>;
      case 'cancelled': return <span className="px-2.5 py-1 bg-[#111116] text-slate-500 border border-white/10 rounded-sm text-[10px] font-mono uppercase tracking-widest">Cancelled</span>;
      case 'refunded': return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(244,63,94,0.1)]">Refunded to User</span>;
      default: return <span className="px-2.5 py-1 bg-white/5 text-slate-400 border border-white/10 rounded-sm text-[10px] font-mono uppercase tracking-widest shadow-[0_0_10px_rgba(255,255,255,0.05)]">{status}</span>;
    }
  };

  const columns = [
    {
      header: 'Txn / Booking ID',
      accessor: '_id',
      render: (p) => (
        <div className="flex flex-col gap-1">
          <div className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5"><ArrowRightLeft className="w-3 h-3 text-emerald-500" /> {p._id.slice(-8).toUpperCase()}</div>
          <div className="text-[10px] font-mono text-slate-500">{new Date(p.createdAt).toLocaleString()}</div>
        </div>
      )
    },
    {
      header: 'Vendor Info',
      accessor: 'vendor',
      render: (p) => (
        <div className="flex flex-col gap-1">
          <div className="font-bold text-slate-200 text-sm flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-500" /> {p.vendor?.businessName || 'Business Name'}</div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500" /> {p.vendor?.phone || 'No Phone Number'}</div>
        </div>
      )
    },
    {
      header: 'Platform Fees',
      accessor: 'totalAmount',
      render: (p) => {
        const totalAmount = p.pricing?.totalPrice || p.totalAmount || 0;
        const platformFee = Math.round(totalAmount * 0.10); // Example 10%
        return (
          <div className="flex flex-col gap-1">
            <div className="font-mono font-bold text-rose-400/50 line-through decoration-rose-500/30 text-xs">
              ₹{totalAmount.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono font-bold text-rose-400 mt-0.5 border border-rose-500/20 bg-rose-500/5 inline-block px-1.5 py-0.5 rounded-sm w-fit">
              - 10% (₹{platformFee.toLocaleString()}) Fee
            </div>
          </div>
        );
      }
    },
    {
      header: 'Net Payable',
      accessor: 'netPayable',
      render: (p) => {
        const totalAmount = p.pricing?.totalPrice || p.totalAmount || 0;
        const platformFee = Math.round(totalAmount * 0.10); // Example 10%
        const vendorReceives = totalAmount - platformFee;
        return (
          <div className="font-mono text-sm font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)] flex items-center gap-1">
            ₹{vendorReceives.toLocaleString()}
          </div>
        );
      }
    },
    {
      header: 'Status',
      accessor: 'paymentStatus',
      render: (p) => getStatusBadge(p.paymentStatus)
    },
    {
      header: 'Actions',
      className: 'text-right',
      tdClassName: 'text-right',
      render: (p) => (
        <div className="flex justify-end gap-2">
          {p.paymentStatus === 'pending' && p.status !== 'cancelled' ? (
            <button
              onClick={() => handleMarkPayout(p._id)}
              disabled={processingPayout === p._id}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-widest uppercase font-bold transition-all border
                ${processingPayout === p._id
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                }`}
            >
              {processingPayout === p._id ? 'Working...' : 'Mark as Paid'}
            </button>
          ) : (
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest border border-white/5 bg-[#111116] px-2 py-1.5 rounded-lg">
              Settled
            </span>
          )}
        </div>
      )
    }
  ];

  if (loading) return (
    <div className="p-8 h-full flex flex-col items-center justify-center space-y-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-cyan-500 animate-spin-reverse opacity-70"></div>
        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
      </div>
      <div className="text-xs font-mono text-emerald-400 tracking-[0.3em] uppercase animate-pulse">Decrypting Financial Vector...</div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Wallet className="w-7 h-7 text-emerald-400 opacity-80" /> Vendor Payouts Console
          </h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-2">Financial Settlements & Transactions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <input
              type="text"
              placeholder="Search by Vendor Name..."
              className="bg-[#0a0a0c]/80 backdrop-blur-xl pl-10 pr-4 py-2 border border-white/10 rounded-lg focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none text-sm text-slate-200 w-64 md:w-72 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all placeholder:text-slate-600 font-mono"
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
        searchKeys={['vendor.businessName', 'vendor.phone', '_id']}
        emptyText="NULL OUTPUT: No payout records found in the ledger."
        exportFilename="vendor_payouts_ledger"
      />
    </div>
  );
}
