'use client';

import { useState, useEffect } from 'react';
import api from '@/core/Api';
import {
  Mail, CheckCircle, Trash2, Clock, User, Phone, Terminal,
  ShieldAlert, MessageSquare, ExternalLink, Filter, Search,
  Eye, AlertCircle, CheckSquare, XCircle, Info, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loading from '@/components/admin/Loading';

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState('disputes'); // 'inquiries' or 'disputes'
  const [data, setData] = useState({ inquiries: [], disputes: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [msgTarget, setMsgTarget] = useState('all'); // 'all', 'traveller', 'vendor'
  const chatEndRef = useState(null);

  const scrollToBottom = () => {
    const chatContainer = document.getElementById('chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedItem && activeTab === 'disputes') {
      loadMessages(selectedItem._id);
    }
  }, [selectedItem, activeTab]);

  const loadMessages = async (disputeId) => {
    try {
      const res = await api.admin.disputes.getMessages(disputeId);
      if (res.success) setMessages(res.data || []);
    } catch (e) { console.error("Chat load error:", e); }
  };

  const handleSendMessage = async (text, overrideTarget = null) => {
    if (!text.trim() || isSending) return;
    const target = overrideTarget || msgTarget;
    setIsSending(true);
    try {
      const res = await api.admin.disputes.sendMessage(selectedItem._id, { message: text, target });
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
      }
    } catch (e) { console.error("Send error:", e); }
    finally { setIsSending(false); }
  };

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    setLoading(true);
    try {
      const [inqRes, dispRes] = await Promise.all([
        api.admin.inquiries.getAll(),
        api.admin.disputes.getAll()
      ]);

      setData({
        inquiries: inqRes.success ? (inqRes.data.inquiries || inqRes.data) : [],
        disputes: dispRes.success ? (dispRes.data.disputes || dispRes.data) : []
      });
    } catch (error) {
      console.error("Support fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInquiry = async (id, status) => {
    try {
      const res = await api.admin.inquiries.update(id, { status });
      if (res.success) {
        setData(prev => ({
          ...prev,
          inquiries: prev.inquiries.map(i => i._id === id ? { ...i, status } : i)
        }));
        if (selectedItem?._id === id) setSelectedItem({ ...selectedItem, status });
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteInquiry = async (id) => {
    if (!confirm("Purge this communication record?")) return;
    try {
      const res = await api.admin.inquiries.delete(id);
      if (res.success) {
        setData(prev => ({ ...prev, inquiries: prev.inquiries.filter(i => i._id !== id) }));
        if (selectedItem?._id === id) setSelectedItem(null);
      }
    } catch (e) { console.error(e); }
  };

  const handleResolveDispute = async (id, status, notes = "") => {
    try {
      const res = await api.admin.disputes.resolve(id, { status, adminNotes: notes });
      if (res.success) {
        setData(prev => ({
          ...prev,
          disputes: prev.disputes.map(d => d._id === id ? { ...d, status, adminNotes: notes } : d)
        }));
        if (selectedItem?._id === id) setSelectedItem({ ...selectedItem, status, adminNotes: notes });
      }
    } catch (e) { console.error(e); }
  };

  const currentList = activeTab === 'inquiries' ? data.inquiries : data.disputes;
  const filteredList = currentList.filter(item => {
    const searchStr = searchQuery.toLowerCase();
    if (activeTab === 'inquiries') {
      return item.name?.toLowerCase().includes(searchStr) || item.subject?.toLowerCase().includes(searchStr) || item.email?.toLowerCase().includes(searchStr);
    } else {
      return item.bookingId?.bookingCode?.toLowerCase().includes(searchStr) || item.reason?.toLowerCase().includes(searchStr) || item.user?.name?.toLowerCase().includes(searchStr);
    }
  });

  return (
    <div className="p-8 h-[calc(100vh-20px)] flex flex-col max-w-[1600px] mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-white/10 pb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3"><Terminal className="w-8 h-8 text-cyan-400 opacity-80" /> Operational Support </h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span> Terminal Active <span className="opacity-50">|</span>
            Signal Strength: <span className="text-cyan-400">Optimal</span>
          </p>
        </div>

        {/* Tabs Switcher */}
        <div className="flex bg-[#111116] p-1 rounded-xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <button onClick={() => { setActiveTab('inquiries'); setSelectedItem(null); }} className={`px-6 py-2.5 text-[10px] font-mono tracking-widest uppercase rounded-lg transition-all flex items-center gap-2 ${activeTab === 'inquiries' ? 'bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            <MessageSquare className="w-3.5 h-3.5" /> General Signals ({data.inquiries.filter(i => i.status !== 'resolved').length})
          </button>
          <button onClick={() => { setActiveTab('disputes'); setSelectedItem(null); }} className={`px-6 py-2.5 text-[10px] font-mono tracking-widest uppercase rounded-lg transition-all flex items-center gap-2 ${activeTab === 'disputes' ? 'bg-rose-500/10 text-rose-400 font-bold border border-rose-500/30' : 'text-slate-500 hover:text-slate-300'}`}>
            <ShieldAlert className="w-3.5 h-3.5" /> Security Incidents ({data.disputes.filter(d => d.status === 'open').length})
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
        {/* Master List Sidebar */}
        <div className="w-full md:w-70 flex flex-col bg-[#111116] border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden shrink-0">
          <div className="p-4 border-b border-white/5 bg-white/[0.02]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder={`SEARCH ${activeTab.toUpperCase()}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg py-2 pl-10 pr-4 text-[10px] font-mono tracking-widest text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-10"><Loading message="Scanning frequencies..." /></div>
            ) : filteredList.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center h-full text-slate-600">
                <Info className="w-12 h-12 mb-4 opacity-10" />
                <div className="text-[10px] font-mono tracking-[0.2em] uppercase">No signals in queue</div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredList.map(item => (
                  <div key={item._id} onClick={() => setSelectedItem(item)} className={`p-5 cursor-pointer transition-all hover:bg-white/[0.03] group relative ${selectedItem?._id === item._id ? 'bg-white/[0.05]' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase border ${(item.status === 'resolved' || item.status?.includes('resolved')) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{item.status || 'open'}</span>
                      <span className="text-[8px] font-mono text-slate-500 tracking-tighter">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className={`text-sm font-bold truncate mb-1 ${selectedItem?._id === item._id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                      {activeTab === 'inquiries' ? (item.subject || 'GENERAL QUERY') : (item.bookingId?.bookingCode || `INCIDENT-${item._id.slice(-4)}`)}
                    </h4>

                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-tight">
                      <User className="w-3 h-3 text-cyan-500/50" />
                      {activeTab === 'inquiries' ? item.name : (item.user?.name || 'TRAVELLER')}
                      {activeTab === 'disputes' && (
                        <span className={`ml-auto px-1.5 py-0.5 rounded ${item.reason === 'safety_concern' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-500/10 text-slate-400'}`}>
                          {item.reason?.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {selectedItem?._id === item._id && (
                      <motion.div layoutId="active-indicator" className={`absolute left-0 top-0 bottom-0 w-1 ${activeTab === 'inquiries' ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'bg-rose-400 shadow-[0_0_15px_#f43f5e]'}`} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail View Pane */}
        <div className="flex-1 bg-[#111116] border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div key={selectedItem._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {/* Header Data */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-8 mb-8 pb-8 border-b border-white/5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-xl border ${activeTab === 'inquiries' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        {activeTab === 'inquiries' ? <MessageSquare className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                          {activeTab === 'inquiries' ? (selectedItem.subject || 'General Inquiry') : `Dispute: ${selectedItem.reason?.replace('_', ' ').toUpperCase()}`}
                        </h2>
                        <div className="text-[10px] font-mono text-slate-500 tracking-[0.2em] uppercase mt-1">
                          ID: {selectedItem._id} <span className="mx-2 opacity-30">|</span> Received: {new Date(selectedItem.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {activeTab === 'disputes' ? (
                      <>
                        <div className="grid grid-cols-1 xl:grid-cols-1 gap-2">
                          {/* Traveller Card */}
                          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><User className="w-12 h-12" /></div>
                            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Traveller
                            </div>
                            <div className="text-lg font-bold text-white mb-1">{selectedItem?.traveller?.name || selectedItem?.user?.name || selectedItem?.bookingId?.user?.name || 'Anonymous'}</div>
                            <div className="text-[10px] font-mono text-slate-500 truncate mb-1">{selectedItem?.traveller?.email || selectedItem?.user?.email || selectedItem?.bookingId?.user?.email}</div>
                            <div className="text-[10px] font-mono text-cyan-400/70 mb-4">{selectedItem?.traveller?.phone || selectedItem?.user?.phone || selectedItem?.bookingId?.user?.phone || 'No Phone Linked'}</div>
                            <div className="flex gap-2">
                              <button onClick={() => window.open(`/admin/travellers/${selectedItem?.user?._id || selectedItem?.traveller?._id}`, '_blank')} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[9px] font-mono py-2 rounded-lg border border-white/5 transition-all uppercase">Profile</button>
                              <button
                                onClick={() => {
                                  const phone = selectedItem?.traveller?.phone || selectedItem?.user?.phone || selectedItem?.bookingId?.user?.phone;
                                  const email = selectedItem?.traveller?.email || selectedItem?.user?.email || selectedItem?.bookingId?.user?.email;
                                  const name = selectedItem?.traveller?.name || selectedItem?.user?.name || 'Traveller';
                                  if (phone) {
                                    window.location.href = `tel:${phone}`;
                                  } else {
                                    window.location.href = `mailto:${email}?subject=Regarding your Dispute: ${selectedItem?.bookingId?.bookingCode}&body=Hello ${name}, we are investigating your dispute regarding ${selectedItem?.reason}. Please provide more details.`;
                                  }
                                }}
                                className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[9px] font-mono py-2 rounded-lg border border-cyan-500/20 transition-all uppercase"
                              >
                                Contact
                              </button>
                            </div>
                          </div>

                          {/* Vendor Card */}
                          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><ExternalLink className="w-12 h-12" /></div>
                            <div className="text-[10px] font-mono text-amber-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Vendor
                            </div>
                            <div className="text-lg font-bold text-white mb-1">{selectedItem?.vendor?.businessName || selectedItem?.bookingId?.vendor?.businessName || 'Platform Vendor'}</div>
                            <div className="text-[10px] font-mono text-slate-500 truncate mb-1">Owner: {selectedItem?.vendor?.user?.name || selectedItem?.bookingId?.vendor?.user?.name || 'N/A'}</div>
                            <div className="text-[10px] font-mono text-amber-400/70 mb-4">{selectedItem?.vendor?.user?.phone || selectedItem?.bookingId?.vendor?.user?.phone || 'No Contact Linked'}</div>
                            <div className="flex gap-2">
                              <button onClick={() => window.open(`/admin/vendors/${selectedItem?.vendor?._id}`, '_blank')} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[9px] font-mono py-2 rounded-lg border border-white/5 transition-all uppercase">History</button>
                              <button onClick={() => {
                                const phone = selectedItem?.vendor?.user?.phone || selectedItem?.bookingId?.vendor?.user?.phone;
                                const email = selectedItem?.vendor?.user?.email || selectedItem?.bookingId?.vendor?.user?.email;
                                const business = selectedItem?.vendor?.businessName || 'Vendor';
                                if (phone) {
                                  window.location.href = `tel:${phone}`;
                                } else {
                                  window.location.href = `mailto:${email}?subject=Urgent: Dispute filed for Booking ${selectedItem?.bookingId?.bookingCode}&body=Notice to ${business}: A dispute has been filed regarding ${selectedItem?.reason}. Please explain your side.`;
                                }
                              }}
                                className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] font-mono py-2 rounded-lg border border-amber-500/20 transition-all uppercase"
                              >
                                Contact
                              </button>
                            </div>
                          </div>

                          {/* Financial Context */}
                          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="text-[10px] font-mono text-rose-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Settlement Context
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-mono text-slate-500 uppercase">Booking Amount</span>
                                <span className="text-xl font-bold text-white">₹{selectedItem?.bookingId?.pricing?.total || '0.00'}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                <span className="text-[10px] font-mono text-slate-500 uppercase">Current Status</span>
                                <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-widest">{selectedItem?.status}</span>
                              </div>
                              <div className="pt-2">
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500/40" style={{ width: `${selectedItem?.refundPercent || 0}%` }}></div>
                                </div>
                                <div className="mt-1 text-[8px] font-mono text-slate-600 uppercase tracking-tighter italic">Proposed Refund: ₹{((selectedItem?.bookingId?.pricing?.total || 0) * (selectedItem?.refundPercent || 0) / 100).toFixed(2)}</div>
                              </div>
                            </div>
                          </div>

                          {/* Settlement Controls */}
                          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
                            <div className="text-[10px] font-mono text-rose-400 uppercase tracking-[0.2em] mb-4 flex justify-between gap-2">
                              <div className="text-[10px] font-mono text-rose-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Resolution Finalizer</div>
                              <div className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-3 py-1 rounded border border-rose-500/20">DANGER ZONE</div>
                            </div>

                            <div className="space-y-3 mb-3">
                              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 px-1">
                                <div className="text-[10px] font-mono text-slate-400 uppercase">Adjust Refund Weight</div>
                                <div className="text-[10px] font-mono text-slate-400/70 bg-slate-500/10 px-2 py-1 rounded border border-slate-500/20">{selectedItem?.refundPercent || 0}%</div>
                              </div>
                              <input type="range" min="0" max="100" step="5" value={selectedItem?.refundPercent || 0} onChange={(e) => setSelectedItem({ ...selectedItem, refundPercent: e.target.value })} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleResolveDispute(selectedItem._id, 'resolved_refunded', (selectedItem.adminNotes || '') + `\nADMIN >> [RESOLVED] Refunded ${selectedItem.refundPercent || 0}%. Case closed.`)} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[9px] font-mono py-2 rounded-lg border border-white/5 transition-all uppercase">Execute Refund</button>
                              <button onClick={() => handleResolveDispute(selectedItem._id, 'resolved_rejected', (selectedItem.adminNotes || '') + '\nADMIN >> [RESOLVED] Dispute rejected after investigation.')} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[9px] font-mono py-2 rounded-lg border border-rose-500/20 transition-all uppercase">Reject Claim</button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="mt-8 bg-black/40 p-6 rounded-2xl border border-white/5">
                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Inquiry Metadata</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">Email Address</div>
                            <div className="text-sm text-cyan-400">{selectedItem?.email}</div>
                          </div>
                          <div>
                            <div className="text-[8px] font-mono text-slate-600 uppercase mb-1">Contact Phone</div>
                            <div className="text-sm text-slate-300">{selectedItem?.phone || 'N/A'}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mb-2">Investigation Workflow</div>

                    {activeTab === 'inquiries' ? (
                      <div className="space-y-3">
                        {selectedItem.status !== 'resolved' && (
                          <button onClick={() => handleUpdateInquiry(selectedItem._id, 'resolved')} className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-mono tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                            <CheckSquare className="w-4 h-4" /> Mark as Resolved
                          </button>
                        )}
                        <button onClick={() => handleDeleteInquiry(selectedItem._id)} className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-mono tracking-widest uppercase transition-all">
                          <Trash2 className="w-4 h-4" /> Purge Record
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Chat Interface Layer */}
                        <div className="w-full md:w-100 bg-black/60 border border-white/10 rounded-2xl flex flex-col h-[550px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl relative group/chat">
                          {/* Decorative Scanline Effect */}
                          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] z-10 opacity-30"></div>

                          {/* Chat Header */}
                          <div className="p-4 border-b border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent flex items-center justify-between z-20">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping opacity-40"></div>
                              </div>
                              <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-white/90">
                                Secure Line: {selectedItem.bookingId?.bookingCode || 'INVESTIGATION-X'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <a href={`tel:${selectedItem.phone || selectedItem.user?.phone}`} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all hover:text-emerald-400"><Phone className="w-4 h-4" /></a>
                              <button onClick={() => alert(`DISPUTE INTEL:\n\nID: ${selectedItem._id}\nReason: ${selectedItem.reason}\nReporter: ${selectedItem.user?.name}\nVendor: ${selectedItem.vendor?.businessName}`)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all hover:text-cyan-400"><Info className="w-4 h-4" /></button>
                            </div>
                          </div>

                          {/* Messages Area */}
                          <div id="chat-messages-container" className="flex-1 overflow-y-auto p-2 space-y-5 custom-scrollbar bg-black/20 z-20">
                            <div className="text-center pb-4">
                              <span className="text-[9px] font-mono text-slate-600 uppercase tracking-[0.4em] bg-black/60 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                                --- Start of Encrypted Transcript ---
                              </span>
                            </div>

                            {/* System Message */}
                            <div className="flex justify-center">
                              <div className="max-w-[85%] bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 text-[10px] text-blue-400/80 font-mono italic leading-relaxed shadow-inner">
                                <div className="flex items-center gap-2 mb-2 text-[9px] font-bold not-italic opacity-60">
                                  <Terminal className="w-3 h-3" /> SYSTEM BROADCAST
                                </div>
                                Case initialization complete. Monitoring interactions for protocol compliance.
                              </div>
                            </div>

                            {/* Real database messages mapping */}
                            {messages?.map((msg) => {
                              const isMe = msg.sender?.role === 'admin';
                              return (
                                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group/msg`}>
                                  <div className={`max-w-[85%] p-4 rounded-2xl text-[10px] relative transition-all duration-300 ${isMe ? 'bg-cyan-600/15 border border-cyan-500/30 text-cyan-50 rounded-tr-none shadow-[0_0_20px_rgba(6,182,212,0.05)]' : 'bg-white/[0.03] border border-white/10 text-slate-200 rounded-tl-none shadow-xl'}`}>
                                    <div className={`text-[9px] font-mono opacity-50 mb-2 flex items-center gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                      <span className="font-bold tracking-widest">{isMe ? 'INVESTIGATOR' : (msg.sender?.name || 'PARTICIPANT')}</span>
                                      {msg.target && msg.target !== 'all' && (
                                        <span className={`px-1.5 py-0.5 rounded-[4px] border ${msg.target === 'traveller' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'} font-bold`}>
                                          TO {msg.target.toUpperCase()}
                                        </span>
                                      )}
                                      <span className="opacity-40 italic">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                                    {isMe && <div className="absolute -right-1 -top-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Input Area */}
                          <div className="p-4 border-t border-white/10 bg-black/80 z-20">
                            {/* Target Selector */}
                            <div className="flex gap-2 mb-3">
                              {['all', 'traveller', 'vendor'].map(t => (
                                <button
                                  key={t}
                                  onClick={() => setMsgTarget(t)}
                                  className={`px-3 py-1 rounded-md text-[8px] font-mono tracking-widest uppercase transition-all border ${msgTarget === t
                                    ? (t === 'traveller' ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : t === 'vendor' ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/10 border-white/20 text-white')
                                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'}`}
                                >
                                  {t === 'all' ? 'Public' : `Talk to ${t}`}
                                </button>
                              ))}
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); const input = e.target.elements.message; if (input.value && !isSending) { handleSendMessage(input.value); input.value = ''; } }} className="flex gap-3">
                              <div className="flex-1 relative group/input">
                                <input name="message" type="text" placeholder="Type investigation response..." disabled={isSending} autoComplete="off" className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3.5 px-5 text-[13px] font-sans text-white focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.05] transition-all placeholder:text-slate-700 disabled:opacity-50 shadow-inner" />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2"><button type="button" className="p-1 hover:bg-white/10 rounded text-slate-600 hover:text-slate-400 transition-colors"><Plus className="w-4 h-4" /></button></div>
                              </div>
                              <button type="submit" disabled={isSending} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 px-5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center hover:scale-[1.02] active:scale-95">{isSending ? <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div> : <CheckCircle className="w-5 h-5" />}</button>
                            </form>
                            <div className="flex gap-4 mt-4 px-1 overflow-x-auto no-scrollbar">
                              <button onClick={() => handleSendMessage(`Attention ${selectedItem.user?.name || 'Traveller'}, we are investigating your claim. Please provide any evidence.`, 'traveller')} className="whitespace-nowrap text-[9px] font-mono text-slate-500 hover:text-cyan-400 transition-colors uppercase tracking-[0.1em] border-b border-transparent hover:border-cyan-500/30 pb-0.5">+ Ask for Evidence</button>
                              <button onClick={() => handleSendMessage(`Notice to Vendor: A dispute has been filed. Please explain your side regarding: ${selectedItem.reason?.replace('_', ' ')}.`, 'vendor')} className="whitespace-nowrap text-[9px] font-mono text-slate-500 hover:text-amber-400 transition-colors uppercase tracking-[0.1em] border-b border-transparent hover:border-amber-500/30 pb-0.5">+ Challenge Vendor</button>
                            </div>
                          </div>
                        </div>

                        {/* Evidence Attachments */}
                        {activeTab === 'disputes' && selectedItem?.evidenceUrls?.length > 0 && (
                          <div className="w-full md:w-100 p-2 rounded-2xl flex flex-col overflow-hidden relative mt-4">
                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <Eye className="w-3 h-3 text-rose-500" /> Evidence Logs ({selectedItem.evidenceUrls.length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {selectedItem.evidenceUrls.map((ev, idx) => (
                                <a key={idx} href={ev.url} target="_blank" rel="noopener noreferrer" className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-rose-500/50 transition-all bg-black/40 shadow-xl">
                                  <img src={ev.url} alt="Evidence" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="text-[8px] font-mono text-white uppercase tracking-widest">View Full Signal</span>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Body Payload */}
                <div className="space-y-8">
                  <div>
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-cyan-500" /> Data Payload / Description
                    </div>
                    <div className="bg-black/60 border border-white/5 rounded-2xl p-6 relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500/50 to-transparent"></div>
                      <p className="text-slate-300 leading-relaxed text-sm selection:bg-cyan-500/30">
                        {selectedItem.message || selectedItem.description}
                      </p>
                    </div>
                  </div>



                  {/* Admin Context */}
                  {selectedItem.adminNotes && (
                    <div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3 text-amber-500" /> Internal Admin Notes
                      </div>
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-xs font-mono text-amber-400/80 leading-relaxed italic">
                        {selectedItem.adminNotes}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6">
                  <div className="relative inline-block">
                    <Terminal className="w-20 h-20 text-cyan-900 drop-shadow-[0_0_20px_rgba(34,211,238,0.1)]" />
                    <div className="absolute -bottom-2 -right-2 bg-black border border-white/10 p-2 rounded-lg">
                      <Search className="w-4 h-4 text-cyan-500 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-mono tracking-[0.3em] uppercase text-cyan-800">Awaiting Signal Decryption</h3>
                    <p className="text-[10px] font-mono text-slate-700 mt-2">Select a master record to initialize diagnostic interface</p>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                    display: none;
                }
                .custom-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .custom-scrollbar:hover::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
    </div>
  );
}
