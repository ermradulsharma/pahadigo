import { Suspense } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { CATEGORY_SLUGS, CATEGORY_TITLES } from '@/core/Constants/categories.js';
import PackageFilters from '@/app/components/packages/PackageFilters';
import PackageSort from '@/app/components/packages/PackageSort';
import PackageCard from '@/app/components/packages/PackageCard';
import Pagination from '@/app/components/ui/Pagination';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop';

function getReadableType(rawType) {
    const key = Object.keys(CATEGORY_SLUGS).find(k => CATEGORY_SLUGS[k] === rawType?.toLowerCase());
    return key ? CATEGORY_TITLES[key] : (rawType || 'Package').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function resolveImageUrl(photos) {
    let imageUrl = '';
    if (photos && photos.url) imageUrl = photos.url;
    else if (Array.isArray(photos) && photos[0]) imageUrl = photos[0].url || photos[0];
    else if (typeof photos === 'string') imageUrl = photos;

    return (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '')
        ? imageUrl
        : DEFAULT_IMAGE;
}

function formatServiceItem(item, fallbackCategory = 'Package') {
    // console.log("item", item);
    const basePrice = item.pricing?.basePrice;
    const gst = item.pricing?.gst || 0;
    const sellingPrice = basePrice ? Math.round((basePrice * (1 + (gst / 100)) + Number.EPSILON) * 100) / 100 : 0;
    return {
        _id: item.id,
        category: item.categoryName,
        title: item.title,
        pricing: sellingPrice,
        location: item.address,
        photos: [{ url: resolveImageUrl(item.photos) }],
        vendor: item.vendor?.businessName || 'Verified Vendor'
    };
}

export async function generateMetadata({ searchParams }) {
    const { category } = await searchParams || {};
    const formattedCategory = category ? getReadableType(category) : '';
    const title = category ? `${formattedCategory} Packages & Trips in Himachal | PahadiGo` : 'Explore Himachal Tour Packages, Homestays & Cab Rentals | PahadiGo';
    const description = category ? `Book verified ${formattedCategory} experiences in Himachal Pradesh. Compare pricing, verified host reviews, and itineraries on PahadiGo.` : 'Discover and book curated tour packages, cab rentals for Spiti & Leh, authentic homestays, and trekking adventures across Himachal Pradesh.';

    return {
        title,
        description,
        keywords: [
            category ? `${formattedCategory} Himachal` : 'Himachal Tour Packages',
            'Manali Tour Packages',
            'Spiti Valley Trip',
            'Kasol Homestays',
            'Himachal Cab Booking',
            'PahadiGo Packages'
        ],
        openGraph: {
            title,
            description,
            url: 'https://pahadigo.co.in/packages',
            siteName: 'PahadiGo',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
        },
        alternates: {
            canonical: '/packages',
        }
    };
}

async function getServices(category, page = 1, q = '', maxPrice = '', sort = '') {
    try {
        let url = `${process.env.NEXT_PUBLIC_API_URL}/packages?limit=12&page=${page}`;
        if (!category) url += '&format=flat';
        if (q) url += `&q=${encodeURIComponent(q)}`;
        if (maxPrice) url += `&maxPrice=${maxPrice}`;
        if (sort) url += `&sort=${sort}`;

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return { services: [], pagination: null };

        const result = await res.json();
        let allServices = [];
        let pagination = null;

        if (!category && result.data && result.data.items) {
            pagination = result.data.pagination;
            allServices = (result.data.items || []).map(item => formatServiceItem(item));
        } else {
            const categoriesData = result.data || {};
            Object.entries(categoriesData).forEach(([slug, categoryObj]) => {
                if (category && slug.toLowerCase() !== category.toLowerCase()) return;
                if (categoryObj.pagination && !pagination) pagination = categoryObj.pagination;
                const items = categoryObj.items || [];
                items.forEach(item => {
                    allServices.push(formatServiceItem(item, slug));
                });
            });
        }

        return { services: allServices, pagination };
    } catch (error) {
        return { services: [], pagination: null };
    }
}

export default async function PackagesPage({ searchParams }) {
    const paramsObj = await searchParams || {};
    const { category, page: pageParam, q, maxPrice, sort } = paramsObj;
    const currentPage = parseInt(pageParam) || 1;
    const { services, pagination } = await getServices(category, currentPage, q, maxPrice, sort);
    const totalPages = pagination?.totalPages || 1;

    // Filter categories to display
    const visibleCategories = Object.keys(CATEGORY_SLUGS).filter(key => key !== 'RIVER_RAFTING' && key !== 'BIKE_SCOOTER_RENTAL');
    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            {/* Top Page Header (Clean, Typography Driven) */}
            <div className="bg-gray-900 pt-32 pb-16 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <span className="text-primary-400 font-bold text-sm tracking-widest uppercase mb-3 block drop-shadow-sm">{category ? getReadableType(category) : 'Discover'}</span>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight font-display drop-shadow-md">{category ? `${getReadableType(category)} Experiences` : 'Explore the Himalayas'}</h1>
                            <p className="text-gray-300 mt-4 text-lg max-w-2xl font-medium leading-relaxed">Curated adventures, stays, and rentals from top verified local vendors.</p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-8xl mx-auto p-4 sm:p-6 lg:p-10">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Sidebar Filters */}
                    <Suspense fallback={<div className="w-full lg:w-[300px] h-[500px] bg-gray-100 rounded-2xl animate-pulse flex-shrink-0"></div>}>
                        <PackageFilters visibleCategories={visibleCategories} />
                    </Suspense>

                    {/* Main Content Area */}
                    <div className="w-full lg:flex-1">
                        {/* Top Action Bar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-5 border-b border-gray-200">
                            <div><p className="text-gray-900 font-semibold">{pagination ? <><span className="font-extrabold">{pagination.total}</span> experiences found</> : <><span className="font-extrabold">{services.length}</span> experiences found</>}</p></div>
                            <Suspense fallback={<div className="mt-4 sm:mt-0 w-64 h-10 bg-gray-100 rounded-xl animate-pulse"></div>}>
                                <PackageSort />
                            </Suspense>
                        </div>

                        {services.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {services.map((service) => (
                                    <PackageCard key={service._id} service={service} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-24 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm mb-4"><Search className="w-6 h-6 text-gray-400" /></div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">No experiences found</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">We couldn't find any packages matching your criteria. Try adjusting your filters.</p>
                                <Link href="/packages" className="mt-6 inline-block px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">Clear Filters</Link>
                            </div>
                        )}
                    </div>
                </div>
                {/* Pagination Controls */}
                <Suspense fallback={<div className="mt-16 mb-8 flex justify-center items-center h-12 w-full max-w-sm mx-auto bg-gray-100 rounded-xl animate-pulse"></div>}>
                    <Pagination currentPage={currentPage} totalPages={totalPages} />
                </Suspense>
            </main>
        </div>
    );
}

