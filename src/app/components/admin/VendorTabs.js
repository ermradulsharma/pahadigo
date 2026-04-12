'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function VendorTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'personal', name: 'Personal Profile' },
    { id: 'business', name: 'Business Profile' },
    { id: 'package', name: 'Category List' },
    { id: 'documents', name: 'Category Docs' },
  ];

  return (
    <div className="px-8 border-t border-white/5">
      <nav className="flex gap-8 max-w-[1600px] mx-auto overflow-x-auto overflow-y-hidden cyber-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 text-xs font-mono tracking-widest uppercase border-b-2 transition-all duration-300 whitespace-nowrap ${isActive ? 'border-indigo-500 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'border-transparent text-slate-500 hover:text-cyan-200 hover:border-white/20'}`}> {tab.name} </button>
          );
        })}
      </nav>
    </div>
  );
}
