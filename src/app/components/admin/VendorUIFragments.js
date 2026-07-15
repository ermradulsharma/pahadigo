'use client';
import { ShieldCheck, AlertTriangle, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import VendorTabs from '@/components/admin/VendorTabs.js';

export function DetailItem({ label, value, mono }) {
    return (
        <div>
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] block mb-1">{label}</label>
            <div className={`text-[13px] font-medium text-cyan-50 ${mono ? 'font-mono tracking-wider' : ''}`}> {value || <span className="text-slate-600 italic">Not provided</span>}</div>
        </div>
    );
}

export function StatusBadge({ status }) {
    const config = {
        pending: { bg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]', text: 'text-amber-400', dot: 'bg-amber-400' },
        active: { bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
        verified: { bg: 'bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
        inactive: { bg: 'bg-slate-500/10 border-slate-500/20 shadow-[0_0_10px_rgba(100,116,139,0.1)]', text: 'text-slate-400', dot: 'bg-slate-400' },
        reject: { bg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]', text: 'text-rose-400', dot: 'bg-rose-400' },
        rejected: { bg: 'bg-rose-500/20 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)]', text: 'text-rose-400', dot: 'bg-rose-400' },
        blocked: { bg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]', text: 'text-rose-400', dot: 'bg-rose-400' },
        suspended: { bg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]', text: 'text-rose-400', dot: 'bg-rose-400' },
        deleted: { bg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]', text: 'text-rose-400', dot: 'bg-rose-400' },
    };
    const { bg, text, dot } = config[status] || { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' };

    return (
        <span className={`px-2.5 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border ${bg} ${text}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_5px_currentColor] ${dot}`}></span>
            {status || 'Unknown'}
        </span>
    );
}

export function Badge({ children, color = 'slate', icon: Icon }) {
    const colors = {
        emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
        rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
        amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
        cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]',
        indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.1)]',
        slate: 'bg-slate-500/10 border-slate-500/20 text-slate-400 shadow-[0_0_10px_rgba(100,116,139,0.1)]',
        violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.1)]',
    };

    return (
        <span className={`px-2 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md ${colors[color] || colors.slate}`}>
            {Icon && <Icon className="w-3 h-3" />}
            {children}
        </span>
    );
}

export function SidebarCard({ title, icon: Icon, colorClass = "text-indigo-400", accentColor = "via-indigo-500/50", children, headerActions }) {
    return (
        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none rounded-xl overflow-hidden"></div>
            <div className={`absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent ${accentColor} to-transparent`}></div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-6 p-3 bg-white/[0.02] border border-white/5 rounded-lg relative z-10">
                <h3 className={`text-[10px] font-mono font-bold ${colorClass} uppercase tracking-[0.2em] relative z-20 flex items-center gap-2`}>
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {title}
                </h3>
                {headerActions && <div className="flex flex-wrap gap-2">{headerActions}</div>}
            </div>

            <div className="space-y-6 relative z-10">
                {children}
            </div>
        </div>
    );
}

const STATUS_LIST = ['active', 'pending', 'inactive', 'reject', 'blocked', 'suspended', 'deleted'];

export function UnifiedStatusMenu({ label, currentStatus, isOpen, onToggle, onSelect, colorTheme = "indigo" }) {
    const themeClasses = {
        indigo: {
            text: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            hoverText: 'hover:text-indigo-200',
            hoverBg: 'hover:bg-indigo-500/15',
            focusBg: 'focus:bg-indigo-500/25',
            dot: 'bg-indigo-400',
            dotShadow: 'shadow-[0_0_10px_rgba(99,102,241,1)]',
            ping: 'bg-indigo-500',
            itemHoverBg: 'group-hover/item:bg-indigo-500/30'
        },
        cyan: {
            text: 'text-cyan-400',
            bg: 'bg-cyan-500/10',
            hoverText: 'hover:text-cyan-200',
            hoverBg: 'hover:bg-cyan-500/15',
            focusBg: 'focus:bg-cyan-500/25',
            dot: 'bg-cyan-400',
            dotShadow: 'shadow-[0_0_10px_rgba(34,211,238,1)]',
            ping: 'bg-cyan-500',
            itemHoverBg: 'group-hover/item:bg-cyan-500/30'
        }
    };

    const theme = themeClasses[colorTheme] || themeClasses.indigo;

    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">{label}</span>
            <div className="relative">
                <button onClick={onToggle} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-all active:scale-95 group/btn cursor-pointer">
                    <StatusBadge status={currentStatus} />
                    <svg className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[90]" onClick={onToggle}></div>
                        <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-[#0a0a0f]/95 border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[100] p-1.5 backdrop-blur-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 ring-1 ring-white/10 origin-top-right overflow-hidden">
                            <div className="text-[7.5px] font-mono font-bold text-slate-500 px-3 py-2 uppercase tracking-[0.25em] border-b border-white/5 mb-1 flex items-center justify-between">
                                <span>Lifecycle Matrix</span>
                                <span className={`w-1 h-1 ${theme.ping} rounded-full animate-ping`}></span>
                            </div>
                            <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                                {STATUS_LIST.map(s => (
                                    <button key={s} onClick={() => { onSelect(s); onToggle(); }} className={`w-full text-left px-3 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-between group/item mb-0.5 last:mb-0 cursor-pointer outline-none ${currentStatus === s ? `${theme.text} ${theme.bg}` : `text-slate-400 ${theme.hoverText} ${theme.hoverBg} ${theme.focusBg}`}`}>
                                        {s}
                                        {currentStatus === s ? (
                                            <div className={`w-1.5 h-1.5 ${theme.dot} rounded-full ${theme.dotShadow}`}></div>
                                        ) : (
                                            <div className={`w-1 h-1 bg-white/5 rounded-full ${theme.itemHoverBg} transition-colors`}></div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export function ProgressItem({ label, percent, color }) {
    return (
        <div>
            <div className="flex justify-between text-[10px] font-mono tracking-widest uppercase mb-1.5">
                <span className="text-slate-400">{label}</span>
                <span className="text-cyan-400 font-bold drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">{percent}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)]">
                <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
}

export function DocumentSection({ title, docs: rawDocs, field, onVerify, onOCR, verifying, onPreview, compact, ocr, priority }) {
    const docs = (Array.isArray(rawDocs) ? rawDocs : (rawDocs ? [rawDocs] : [])).filter(doc => doc && doc.url);
    if (docs.length === 0) return null;
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-bold font-mono text-cyan-500 uppercase tracking-[0.3em] drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">{title}</h4>
                <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/20 to-transparent ml-4"></div>
            </div>
            <div className={`grid grid-cols-1 sm:grid-cols-${docs.length} lg:grid-cols-${docs.length} gap-5`}>
                {docs.map((doc, idx) => (
                    <div key={idx} className="group relative bg-[#111116] border border-white/10 rounded-xl overflow-hidden transition-all duration-500 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col">
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none transition-opacity group-hover:opacity-20 z-0"></div>

                        {/* Status Float */}
                        <div className="absolute top-3 right-3 z-20"> <StatusBadge status={doc.status} /> </div>

                        {/* SaaS Ultra Image Preview */}
                        <div className="relative h-48 w-full bg-black overflow-hidden cursor-zoom-in group-hover:block z-10" onClick={() => onPreview(doc.url)}>
                            <Image src={doc.url?.replace(/\.pdf$/i, '.jpg')} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1 opacity-80 group-hover:opacity-100 mix-blend-screen" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={priority} />

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 opacity-70"></div>

                            {/* Glassmorphism Zoom Indicator */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white/5 backdrop-blur-md border border-white/20 p-3 rounded-full transform scale-50 group-hover:scale-100 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                    <svg className="w-6 h-6 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer / Actions */}
                        <div className="p-5 flex-1 flex flex-col relative z-20 bg-black/40 border-t border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] leading-none mb-1">Hash Reference</span>
                                    <span className="text-[11px] font-mono text-cyan-100/70 tracking-widest pl-1 border-l-2 border-indigo-500/50">#{doc.url?.split('/').pop().slice(-8) || 'N/A'}</span>
                                </div>
                                {doc.status !== 'verified' && doc.status !== 'approved' && ocr && (
                                    <button disabled={verifying === `${field}-${idx}`} onClick={() => onOCR(field, idx)} className="h-8 px-3.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[9px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-indigo-500/20 hover:text-indigo-300 hover:shadow-[0_0_10px_rgba(99,102,241,0.2)] transition-all flex items-center gap-2">
                                        {verifying === `${field}-${idx}` ? (
                                            <div className="w-2.5 h-2.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
                                        )}
                                        {verifying === `${field}-${idx}` ? 'SCANNING' : 'RUN OCR'}
                                    </button>
                                )}
                            </div>

                            {doc.ocrData?.identifiedId && (
                                <div className="bg-black/80 rounded-lg p-3 border border-emerald-500/20 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">Identified Identity</span>
                                        <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1 drop-shadow-[0_0_3px_rgba(16,185,129,0.8)]">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> MATCH LINKED
                                        </span>
                                    </div>
                                    <div className="text-[12px] font-bold text-cyan-50 font-mono tracking-widest">{doc.ocrData.identifiedId}</div>
                                </div>
                            )}

                            {doc.reason && (
                                <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 mb-4 shadow-[0_0_15px_rgba(244,63,94,0.05)]">
                                    <div className="text-[8px] font-mono font-bold text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> System Fault Directive</div>
                                    <div className="text-xs text-rose-300 font-mono leading-relaxed">{doc.reason}</div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 mt-auto">
                                {doc.status !== 'verified' && doc.status !== 'approved' && (
                                    <button onClick={() => onVerify(field, 'verified', null, idx)} className="h-9 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-emerald-500/20 hover:text-emerald-300 transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]">ACCEPT</button>
                                )}
                                {doc.status !== 'rejected' && (
                                    <button onClick={() => { const r = prompt('Directive fault reason?'); if (r) onVerify(field, 'rejected', r, idx); }} className="h-9 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold uppercase tracking-[0.2em] hover:bg-rose-500/20 hover:text-rose-300 transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)]">DENY</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function MainPanelCard({ title, icon: Icon, colorClass = "text-indigo-400", description, children }) {
    return (
        <div className="bg-[#111116] rounded-xl border border-white/10 p-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-10 pointer-events-none rounded-xl"></div>
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6 p-3 bg-white/[0.02] border border-white/5 rounded-lg relative z-10">
                <h3 className={`text-[10px] font-mono font-bold ${colorClass} uppercase tracking-[0.2em] relative z-20 flex items-center gap-2`}>{Icon && <Icon className="w-3.5 h-3.5" />}{title}</h3>
            </div>
            <div className="relative z-10">{children}</div>
        </div>
    );
}

export function VendorHeader({ vendor, onBack, id, activeTab, setActiveTab, actions, disableTabs = false }) {
    // if (!vendor) return null;
    return (
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10">
            <div className="max-w-[1600px] mx-auto px-8 py-4">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <button onClick={onBack} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 group cursor-pointer">
                            <svg className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">
                                <Link href="/admin/vendors" className="hover:text-cyan-400 transition-colors">Infrastructure</Link>
                                <span className="text-slate-800">/</span>
                                <span className="text-indigo-400">Node Analysis</span>
                                {vendor?.isApproved && (
                                    <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 ml-4 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                        <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                                        Verified Sector
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                                {vendor?.vendorProfile?.businessName || vendor?.businessName || 'Sector Unknown'}
                            </h1>
                        </div>
                    </div>

                    {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
                </div>
            </div>
            {!disableTabs && <VendorTabs activeTab={activeTab} setActiveTab={setActiveTab} />}
        </header>
    );
}
export function Modal({ isOpen, onClose, title, icon: Icon, children, maxWidth = "max-w-4xl" }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 isolate">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none"></div>

            {/* Modal Container */}
            <div className={`relative w-full ${maxWidth} bg-[#0a0a0f] rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-300 ring-1 ring-white/20`}>
                {/* Header */}
                <div className="px-6 py-4 bg-white/[0.02] border-b border-white/10 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />}
                        <h3 className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.3em]">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 text-slate-500 hover:text-rose-400 rounded-lg transition-all active:scale-95 border border-transparent hover:border-rose-500/20"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto max-h-[85vh] relative scrollbar-hide">
                    {children}
                </div>
            </div>
        </div>
    );
}
