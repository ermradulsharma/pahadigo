'use client';

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
        verified: { bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
        approved: { bg: 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]', text: 'text-emerald-400', dot: 'bg-emerald-400' },
        rejected: { bg: 'bg-rose-500/10 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]', text: 'text-rose-400', dot: 'bg-rose-400' },
        pending: { bg: 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]', text: 'text-amber-400', dot: 'bg-amber-400' }
    };
    const { bg, text, dot } = config[status] || { bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' };

    return (
        <span className={`px-2.5 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-md border ${bg} ${text}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_5px_currentColor] ${dot}`}></span>
            {status || 'Unknown'}
        </span>
    );
}
