'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function PackageSort() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentSort = searchParams.get('sort') || '';

    const handleSort = (newSort) => {
        const params = new URLSearchParams(searchParams.toString());
        if (newSort) {
            params.set('sort', newSort);
        } else {
            params.delete('sort');
        }
        params.delete('page');
        router.push(`${pathname}?${params.toString()}`);
    };

    const isPrice = currentSort.startsWith('price');

    return (
        <div className="mt-4 sm:mt-0 flex items-center space-x-3 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => handleSort('')} className={`px-4 py-2 text-sm rounded-lg transition-colors ${!currentSort ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900 font-medium'}`}>Recommended</button>
            <button onClick={() => handleSort(currentSort === 'price_asc' ? 'price_desc' : 'price_asc')} className={`px-4 py-2 text-sm flex items-center space-x-1.5 rounded-lg transition-colors ${isPrice ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-900 font-medium'}`}>
                <span>Price</span>
                <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                    {currentSort === 'price_asc' && <ArrowUp className="w-3.5 h-3.5" />}
                    {currentSort === 'price_desc' && <ArrowDown className="w-3.5 h-3.5" />}
                </span>
            </button>
            <button disabled className="px-4 py-2 text-gray-300 cursor-not-allowed text-sm font-medium rounded-lg transition-colors" title="Sorting by rating coming soon">Rating</button>
        </div>
    );
}
