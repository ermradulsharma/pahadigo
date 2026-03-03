'use client';

export function DetailItem({ label, value, mono }) {
    return (
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
            <div className={`text-[15px] font-medium text-slate-600 ${mono ? 'font-mono' : ''}`}> {value || 'Not provided'}</div>
        </div>
    );
}

export function StatusBadge({ status }) {
    const config = {
        verified: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
        approved: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', dot: 'bg-emerald-500' },
        rejected: { bg: 'bg-rose-500/10', text: 'text-rose-500', dot: 'bg-rose-500' },
        pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', dot: 'bg-amber-500' }
    };
    const { bg, text, dot } = config[status] || { bg: 'bg-slate-500/10', text: 'text-slate-500', dot: 'bg-slate-500' };

    return (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md border border-white/10 ${bg} ${text}`}>
            <span className={`w-1 h-1 rounded-full animate-pulse ${dot}`}></span>
            {status}
        </span>
    );
}
