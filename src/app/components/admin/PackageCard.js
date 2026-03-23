import React from 'react';
import Link from 'next/link';
import { Briefcase, ExternalLink } from 'lucide-react';

export const getServiceName = (pkg) => {
  return pkg.title || pkg.tourDetails?.tourName || pkg.details?.jumpName || pkg.details?.stretchName || pkg.vehicleDetails?.model || pkg.roomDetails?.roomType || pkg.details?.trekType || pkg.details?.serviceType || 'Unnamed Service';
};

export const getPrice = (pkg) => {
  return pkg.pricing?.pricePerNight || pkg.pricing?.pricePerPerson || pkg.pricing?.pricePerDay || pkg.pricing?.baseFare || 0;
};

export default function PackageCard({ pkg, onInspect, onToggleStatus, showVendorInfo, inspectHref }) {
  return (
    <div key={pkg._id} className="group bg-[#111116] rounded-xl border border-white/10 overflow-hidden hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all flex flex-col relative">
      {/* Thumbnail */}
      <div className="relative h-48 w-full bg-black">
        {pkg.photos?.[0]?.url ? (
          <img src={pkg.photos[0].url} alt={getServiceName(pkg)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-1h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#111116] to-transparent"></div>
        <div className="absolute top-4 right-4">
          <span className={`px-2.5 py-1 rounded border text-[9px] font-mono font-bold uppercase tracking-widest backdrop-blur-md shadow-[0_0_10px_currentColor] ${pkg.isActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
            {pkg.isActive ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col relative z-10">
        <div className="mb-6">
          <h4 className="font-bold text-cyan-50 text-lg leading-tight mb-2 group-hover:text-cyan-400 transition-colors line-clamp-1 truncate">{getServiceName(pkg)}</h4>
          {showVendorInfo ? (
            <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-mono tracking-widest uppercase">
              <Briefcase className="w-3 h-3 text-slate-600" /> {pkg.vendor?.businessName || 'Anonymous Vendor'}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-widest">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
              <span className="line-clamp-1 truncate">{typeof pkg.location === 'object' ? pkg.location?.address : (pkg.location || 'Unknown Vector')}</span>
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between py-4 border-t border-white/5">
          <div>
            <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">Base Exchange Rate</div>
            <div className="text-lg font-mono font-bold text-cyan-400 tracking-tight text-shadow-glow-cyan">₹{Number(getPrice(pkg)).toLocaleString()}</div>
          </div>
          <div className="flex gap-2">
            {inspectHref && (
              <Link href={inspectHref} className="w-9 h-9 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)]" title="Go to Vendor details">
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
            {onInspect && !inspectHref && (
              <button onClick={() => onInspect(pkg)} className="p-2.5 bg-black/50 border border-white/10 text-cyan-400 rounded-lg hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)]" title="Inspect Node">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
            )}
            {onToggleStatus && (
              <button onClick={() => onToggleStatus(pkg, !pkg.isActive)} className={`p-2.5 rounded-lg border transition-all ${pkg.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:border-rose-400/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]'}`} title={pkg.isActive ? 'Disable Package' : 'Enable Package'}>
                {pkg.isActive ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
