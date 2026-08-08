'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, SlidersHorizontal, Check } from 'lucide-react';
import { CATEGORY_SLUGS, CATEGORY_TITLES } from '@/core/Constants/categories.js';

export default function PackageFilters({ visibleCategories }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentCategory = searchParams.get('category');
    const initialQuery = searchParams.get('q') || '';
    const initialMaxPrice = searchParams.get('maxPrice') || '50000';

    const [query, setQuery] = useState(initialQuery);
    const [maxPrice, setMaxPrice] = useState(initialMaxPrice);

    // Debounce search & price
    useEffect(() => {
        const handler = setTimeout(() => {
            updateUrl({ q: query, maxPrice });
        }, 500);

        return () => clearTimeout(handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, maxPrice]);

    const updateUrl = (updates) => {
        const params = new URLSearchParams(searchParams.toString());
        let hasChanges = false;

        if (updates.q !== undefined) {
            if (updates.q && updates.q !== searchParams.get('q')) {
                params.set('q', updates.q);
                hasChanges = true;
            } else if (!updates.q && searchParams.has('q')) {
                params.delete('q');
                hasChanges = true;
            }
        }

        if (updates.maxPrice !== undefined) {
            if (updates.maxPrice && updates.maxPrice !== '50000' && updates.maxPrice !== searchParams.get('maxPrice')) {
                params.set('maxPrice', updates.maxPrice);
                hasChanges = true;
            } else if ((!updates.maxPrice || updates.maxPrice === '50000') && searchParams.has('maxPrice')) {
                params.delete('maxPrice');
                hasChanges = true;
            }
        }

        if (hasChanges) {
            params.delete('page'); // Reset to first page on filter change
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    return (
        <aside className="w-full lg:w-[300px] flex-shrink-0">
            <div className="bg-white/90 backdrop-blur-2xl border border-white/40 rounded-2xl p-5 sticky top-24 shadow-[0_8px_40px_rgb(0,0,0,0.06)] ring-1 ring-gray-900/5">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center shadow-inner border border-primary-100/50"><SlidersHorizontal className="w-4 h-4 text-primary-600" /></div>
                    <h3 className="text-lg font-black text-gray-900 font-display tracking-tight">Filters</h3>
                </div>

                {/* Search */}
                <div className="mb-6 group">
                    <label className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Search</label>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors duration-300" />
                        <input type="text" placeholder="Destination or activity..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-200/80 rounded-xl text-sm font-medium focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all placeholder:text-gray-400 text-gray-900 shadow-sm" />
                    </div>
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-5"></div>
                {/* Categories */}
                <div className="mb-6">
                    <label className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Categories</label>
                    <div className="space-y-1 max-h-[340px] overflow-y-auto custom-scrollbar pr-2">
                        <Link href={pathname + '?' + new URLSearchParams(Array.from(searchParams.entries()).filter(([k]) => k !== 'category' && k !== 'page')).toString()} className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300 ${!currentCategory ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium border border-transparent hover:border-gray-200/60'}`} >
                            <span className="font-semibold text-sm">All Experiences</span>
                            {!currentCategory && <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                        </Link>

                        {visibleCategories.map(key => {
                            const slug = CATEGORY_SLUGS[key];
                            const isSelected = currentCategory && currentCategory.toLowerCase() === slug;

                            const params = new URLSearchParams(searchParams.toString());
                            params.set('category', slug);
                            params.delete('page');

                            return (
                                <Link key={slug} href={`${pathname}?${params.toString()}`} className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-300 ${isSelected ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' : 'bg-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium border border-transparent hover:border-gray-200/60'}`} >
                                    <span className="font-semibold text-sm group-hover:translate-x-1 transition-transform duration-300">{CATEGORY_TITLES[key]}</span>
                                    {isSelected && <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-5"></div>

                {/* Price Range */}
                <div>
                    <div className="flex justify-between items-end mb-3">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Max Price</label>
                        <span className="text-sm font-black text-primary-600 bg-primary-50 px-3 py-1 rounded-lg border border-primary-100/50">{maxPrice === '50000' ? '₹50,000+' : `₹${maxPrice}`}</span>
                    </div>
                    <div className="px-1 py-4 relative group cursor-pointer">
                        <input type="range" min="0" max="50000" step="500" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-600 transition-all hover:h-2.5" />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2 font-bold uppercase tracking-wider"><span>₹0</span><span>₹50k+</span></div>
                </div>
            </div>
        </aside>
    );
}
