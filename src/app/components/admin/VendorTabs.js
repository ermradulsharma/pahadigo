'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function VendorTabs({ id }) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Overview', href: `/admin/vendors/${id}` },
        { name: 'Personal Profile', href: `/admin/vendors/${id}/personal` },
        { name: 'Business Profile', href: `/admin/vendors/${id}/business` },
        { name: 'Packages', href: `/admin/packages/${id}` },
    ];

    return (
        <div className="border-b border-slate-200 bg-white px-8 sticky top-[72px] z-30 shadow-sm">
            <nav className="flex gap-8 max-w-[1600px] mx-auto">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link key={tab.name} href={tab.href} className={`py-4 text-sm font-bold border-b-2 transition-all duration-200 ${isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'}`}> {tab.name} </Link>
                    );
                })}
            </nav>
        </div>
    );
}
