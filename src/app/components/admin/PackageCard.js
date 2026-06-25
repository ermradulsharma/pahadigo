import React, { useState } from 'react';
import Link from 'next/link';
import { Briefcase, ExternalLink, Power, MapPin, Layers } from 'lucide-react';

export const getServiceName = (pkg) => {
    return pkg.title || pkg.tourDetails?.tourName || pkg.details?.jumpName || pkg.details?.stretchName || pkg.vehicleDetails?.model || pkg.roomDetails?.roomType || pkg.details?.trekType || pkg.details?.serviceType || 'Unnamed Service';
};

export const getPrice = (pkg) => {
    return pkg.pricing?.pricePerNight || pkg.pricing?.pricePerPerson || pkg.pricing?.pricePerDay || pkg.pricing?.basePrice || pkg.pricing?.baseFare || 0;
};



export default function PackageCard({ pkg, onToggleStatus, inspectHref, category }) {
    const [loading, setLoading] = useState(false);
    const active = pkg.isActive;

    const handleToggle = async () => {
        if (!onToggleStatus) return;
        setLoading(true);
        try {
            await onToggleStatus(pkg, !active);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group relative bg-[#0d0d12] rounded-2xl border border-white/5 overflow-hidden hover:border-indigo-500/30 transition-all duration-500 flex flex-col shadow-2xl">
            {/* Visual Header */}
            <div className="relative h-52 w-full overflow-hidden bg-slate-900">
                {pkg.photos?.[0]?.url ? (
                    <img src={pkg.photos[0].url} alt={getServiceName(pkg)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 bg-gradient-to-br from-slate-900 to-black">
                        <Layers size={48} strokeWidth={1} />
                        <span className="text-[10px] font-mono mt-2 uppercase tracking-widest opacity-50">No Media</span>
                    </div>
                )}

                {/* Status Badge Overlay */}
                <div className="absolute top-4 left-4">
                    <div className={`px-3 py-1 rounded-full border backdrop-blur-md flex items-center gap-2 transition-all duration-300 ${active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]">{active ? 'Status: Active' : 'Status: Offline'}</span>
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/60 to-transparent"></div>
            </div>

            {/* Content Section */}
            <div className="p-6 pt-2 flex-1 flex flex-col relative z-10">
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-mono font-bold uppercase tracking-xs truncate">{pkg.serviceType?.replace(/-/g, ' ') || category}</span>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <h4 className="font-bold text-white text-lg leading-tight group-hover:text-indigo-300 transition-colors line-clamp-1 truncate font-sans tracking-tight">{getServiceName(pkg)}</h4>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono mb-6 uppercase tracking-wider">
                    <MapPin size={12} className="text-indigo-500/50" />
                    <span className="line-clamp-1 truncate">{typeof pkg.location === 'object' ? pkg.location?.address : (pkg.location || 'Location Not Defined')}</span>
                </div>

                {/* Pricing & Actions */}
                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest block">Standard Rate</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-mono font-bold text-indigo-400 tracking-tighter">₹{Number(getPrice(pkg)).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-700 font-mono">/ Cycle</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={handleToggle} disabled={loading} className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all duration-300 ${active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} title={active ? 'Set Component Offline' : 'Activate Component'}>
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Power size={18} strokeWidth={2.5} />
                            )}
                        </button>

                        {inspectHref && (
                            <Link href={inspectHref} className="w-10 h-10 flex items-center justify-center bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl transition-all shadow-lg shadow-indigo-500/5 group-hover:shadow-indigo-500/20"><ExternalLink size={18} /></Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Edge Decoration */}
            <div className={`absolute inset-x-0 bottom-0 h-0.5 transition-all duration-700 ${active ? 'bg-indigo-500/20 group-hover:bg-indigo-500' : 'bg-rose-500/20 group-hover:bg-rose-500'}`}></div>
        </div>
    );
}
