'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    if (totalPages <= 1) return null;
    const getPaginationUrl = (page) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', page);
        return `${pathname}?${params.toString()}`;
    };

    return (
        <div className="my-8 flex justify-center items-center space-x-2">
            {currentPage > 1 ? (<Link href={getPaginationUrl(currentPage - 1)} className="p-2.5 border border-gray-200 rounded-xl text-gray-600 bg-white hover:bg-gray-50 hover:shadow-sm transition-all shadow-sm"><ChevronLeft className="w-5 h-5" /></Link>) : (<span className="p-2.5 border border-gray-100 rounded-xl text-gray-300 bg-gray-50/50 cursor-not-allowed"><ChevronLeft className="w-5 h-5" /></span>)}
            <div className="flex items-center space-x-1 px-2">{[...Array(totalPages)].map((_, i) => (<Link key={i} href={getPaginationUrl(i + 1)} className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all shadow-sm ${currentPage === i + 1 ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{i + 1}</Link>))}</div>
            {currentPage < totalPages ? (<Link href={getPaginationUrl(currentPage + 1)} className="p-2.5 border border-gray-200 rounded-xl text-gray-600 bg-white hover:bg-gray-50 hover:shadow-sm transition-all shadow-sm"><ChevronRight className="w-5 h-5" /></Link>) : (<span className="p-2.5 border border-gray-100 rounded-xl text-gray-300 bg-gray-50/50 cursor-not-allowed"><ChevronRight className="w-5 h-5" /></span>)}
        </div>
    );
}
