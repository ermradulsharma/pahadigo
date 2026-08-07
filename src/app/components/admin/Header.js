'use client';
import { useRouter } from 'next/navigation';
import { removeToken, getRole } from '@/app/utils/authUtils.js';
import { useEffect, useState, useRef } from 'react';
import { Network, LogOut, Settings, User as UserIcon } from 'lucide-react';

export default function Header({ title }) {
  const router = useRouter();
  const [role, setRole] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchRole = () => {
      const storedRole = getRole();
      if (storedRole) {
        setRole(storedRole);
      }
    };
    fetchRole();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  return (
    <header className="bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between p-6 sticky top-0 z-30 shadow-sm relative">
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-400 opacity-80" />
          <h1 className="text-xl font-bold text-gray-200 tracking-tight">{title || 'Telemetry Control'}</h1>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 hover:bg-white/5 p-1.5 rounded-xl transition-colors focus:outline-none group border border-transparent hover:border-white/10"
        >
          <div className="h-9 w-9 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20 group-hover:bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)] transition-colors">
            {role ? role[0].toUpperCase() : 'A'}
          </div>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 w-60 mt-2 bg-[#0a0a0c] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 transform origin-top-right transition-all overflow-hidden">
            <div className="px-4 py-3 bg-gray-900/50 border-b border-white/5">
              <p className="text-[10px] uppercase font-mono tracking-widest text-gray-500 mb-1">Active Session</p>
              <p className="text-sm font-bold text-indigo-400 break-all">{role || 'System Root'}</p>
            </div>

            <div className="p-1">
              <a href="/admin/profile" className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors group">
                <UserIcon className="mr-3 h-4 w-4 text-gray-500 group-hover:text-indigo-400" />
                Profiling Data
              </a>
              <a href="/admin/settings" className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors group">
                <Settings className="mr-3 h-4 w-4 text-gray-500 group-hover:text-indigo-400" />
                Configuration
              </a>
            </div>

            <div className="p-1 border-t border-white/5">
              <button onClick={handleLogout} className="flex w-full items-center px-3 py-2 text-sm font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg transition-colors group">
                <LogOut className="mr-3 h-4 w-4 text-rose-500 group-hover:text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                Terminate Session
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
