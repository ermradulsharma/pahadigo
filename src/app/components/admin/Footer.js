export default function Footer() {
  return (
    <footer className="bg-[#050505]/90 backdrop-blur-md border-t border-white/5 h-14 flex items-end justify-end p-6 sticky bottom-0 z-30 w-full">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
      <p className="text-xs text-slate-500 font-mono tracking-widest uppercase flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
        &copy; {new Date().getFullYear()} PahadiGo Telemetry. All rights reserved.
      </p>
    </footer>
  );
}
