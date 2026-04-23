'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/core/Helpers/authUtils';
import { Mail, CheckCircle, Trash2, Clock, User, Phone, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SupportPage() {
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/admin/inquiries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInquiries(data.data.inquiries || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setInquiries(prev => prev.map(i => i._id === id ? { ...i, status } : i));
        if (selectedInquiry && selectedInquiry._id === id) {
          setSelectedInquiry({ ...selectedInquiry, status });
        }
      }
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const deleteInquiry = async (id) => {
    if (!confirm("Purge this communication from the database?")) return;
    try {
      const token = getToken();
      await fetch(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setInquiries(prev => prev.filter(i => i._id !== id));
      if (selectedInquiry && selectedInquiry._id === id) {
        setSelectedInquiry(null);
      }
    } catch (error) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 border-b border-white/10 pb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Terminal className="w-7 h-7 text-cyan-400 opacity-80" /> Comms Center
          </h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-2">External Support Signals & Inquiries</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#111116] border border-white/5 py-1.5 px-4 rounded-lg flex gap-4 text-xs font-mono uppercase tracking-widest text-slate-400 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div>Total: <span className="text-cyan-400 font-bold">{inquiries.length}</span></div>
            <div>Unresolved: <span className="text-amber-400 font-bold">{inquiries.filter(i => i.status !== 'resolved').length}</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-[#111116] border border-white/10 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        {/* Sidebar list */}
        <div className="w-1/3 min-w-[320px] bg-black/40 border-r border-white/10 flex flex-col relative z-20">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-mono tracking-widest text-cyan-400 uppercase flex items-center gap-2">
              <Mail className="w-4 h-4" /> Signal Log
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto cyber-scrollbar">
            {loading ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-t-2 border-cyan-500 animate-spin mb-4"></div>
                <div className="text-[10px] font-mono tracking-widest text-cyan-500 uppercase animate-pulse">Scanning frequencies...</div>
              </div>
            ) : inquiries.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center h-full text-slate-500">
                <Mail className="w-10 h-10 mb-3 opacity-20" />
                <div className="text-xs font-mono tracking-widest uppercase">No signals detected</div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {inquiries.map(inquiry => (
                  <div
                    key={inquiry._id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className={`p-4 cursor-pointer transition-all group relative overflow-hidden ${selectedInquiry?._id === inquiry._id ? 'bg-cyan-500/10' : 'hover:bg-white/5'}`}
                  >
                    {selectedInquiry?._id === inquiry._id && (
                      <motion.div layoutId="active-signal" className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                    )}
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase border ${inquiry.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)] animate-pulse'}`}>
                        {inquiry.status}
                      </span>
                      <span className="text-[9px] font-mono tracking-widest text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className={`font-bold text-sm truncate pl-2 ${selectedInquiry?._id === inquiry._id ? 'text-cyan-100' : 'text-slate-300 group-hover:text-cyan-300 transition-colors'}`}>
                      {inquiry.subject || 'UNTITLED SIGNAL'}
                    </h4>
                    <div className="text-xs text-slate-500 mt-1 truncate pl-2 font-mono flex items-center gap-1.5 opacity-80">
                      <User className="w-3 h-3" /> {inquiry.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed relative">
          <div className="absolute inset-0 bg-[#111116]/95 backdrop-blur-sm z-0"></div>

          {selectedInquiry ? (
            <div className="flex-1 overflow-y-auto p-8 relative z-10 cyber-scrollbar">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedInquiry._id}
                className="bg-black/40 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:justify-between md:items-start gap-6 relative z-10 bg-white/[0.01]">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`text-[10px] font-mono tracking-widest uppercase px-3 py-1 rounded-sm border inline-flex items-center gap-1.5 ${selectedInquiry.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]'}`}>
                        {selectedInquiry.status === 'resolved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {selectedInquiry.status}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">ID: {selectedInquiry._id.slice(-8)}</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{selectedInquiry.subject || 'Untitled Signal'}</h2>

                    <div className="mt-6 flex flex-col gap-3">
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-3 w-fit">
                        <div className="w-10 h-10 rounded-full bg-cyan-950 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-cyan-500/30 font-bold uppercase">
                          {selectedInquiry.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-200">{selectedInquiry.name}</div>
                          <div className="text-[10px] font-mono text-cyan-400 tracking-wider"><a href={`mailto:${selectedInquiry.email}`} className="hover:underline">{selectedInquiry.email}</a></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-1 text-[11px] font-mono tracking-widest text-slate-500">
                        {selectedInquiry.phone && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="w-3.5 h-3.5" /> <a href={`tel:${selectedInquiry.phone}`} className="hover:text-cyan-400 transition-colors">{selectedInquiry.phone}</a>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {new Date(selectedInquiry.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-3 shrink-0 mt-2 md:mt-0">
                    {selectedInquiry.status !== 'resolved' && (
                      <button
                        onClick={() => updateStatus(selectedInquiry._id, 'resolved')}
                        className="px-5 py-2.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono tracking-widest uppercase rounded-lg hover:bg-emerald-600/40 hover:text-emerald-300 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" /> Resolve
                      </button>
                    )}
                    <button
                      onClick={() => deleteInquiry(selectedInquiry._id)}
                      className="px-5 py-2.5 bg-rose-600/10 border border-rose-500/30 text-rose-400 text-xs font-mono tracking-widest uppercase rounded-lg hover:bg-rose-600/30 hover:text-rose-200 transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Purge
                    </button>
                  </div>
                </div>

                <div className="p-8 relative z-10">
                  <div className="absolute top-8 left-8 text-cyan-500/10 font-serif text-6xl select-none leading-none pointer-events-none">"</div>
                  <div className="text-slate-300 whitespace-pre-wrap leading-relaxed relative z-10 text-sm md:text-base selection:bg-cyan-500/30 font-medium">
                    {selectedInquiry.message}
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 relative z-10">
              <div className="text-center bg-black/40 p-10 rounded-2xl border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
                <Terminal className="w-16 h-16 mx-auto mb-6 text-cyan-900 drop-shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-pulse" />
                <div className="text-sm font-mono tracking-[0.2em] uppercase text-cyan-600">Awaiting Signal Selection</div>
                <div className="text-xs text-slate-600 mt-2 font-mono">Select a communication to decrypt payload</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
                .cyber-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .cyber-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                .cyber-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(34, 211, 238, 0.2);
                    border-radius: 10px;
                }
                .cyber-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(34, 211, 238, 0.4);
                }
            `}</style>
    </div>
  );
}
