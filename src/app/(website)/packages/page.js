import Link from 'next/link';
import Image from 'next/image';
import PageHero from '@/components/PageHero.js';

import connectDB from '@/core/Config/db.js';
import Package from '@/core/Models/Package.js';
import { Suspense } from 'react';

export async function generateMetadata({ searchParams }) {
    const { category } = await searchParams || {};
    return {
        title: category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Packages` : 'Explore Packages',
        description: category ? `Hand-picked ${category} experiences from our top verified vendors.` : 'Discover the best homestays, camping, and adventure packages curated by top local vendors.'
    };
}

async function getServices(category) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages?limit=all`, { cache: 'no-store' });
        if (!res.ok) return [];

        const result = await res.json();
        const categoriesData = result.data || {};

        let allServices = [];
        Object.entries(categoriesData).forEach(([slug, categoryObj]) => {
            // If a category is requested, filter by it
            if (category && slug.toLowerCase() !== category.toLowerCase()) return;

            const items = categoryObj.items || [];
            items.forEach(item => {
                // Handle photo structure correctly (it's often an object with a url property now)
                let imageUrl = '';
                if (item.photos && item.photos.url) {
                    imageUrl = item.photos.url;
                } else if (Array.isArray(item.photos) && item.photos[0]) {
                    imageUrl = item.photos[0].url || item.photos[0];
                } else if (typeof item.photos === 'string') {
                    imageUrl = item.photos;
                }

                // Final fallback if image is empty
                if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
                    imageUrl = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop';
                }

                allServices.push({
                    _id: item.id || item._id,
                    type: item.category_name || slug,
                    title: item.title || item.roomType || item.campingType || item.trekkingName || item.stretchName || item.jumpName || item.model || item.tourName || 'Package',
                    price: item.pricing?.sellingPrice || item.pricing?.basePrice || item.pricePerNight || item.pricePerPerson || item.pricePerDay || 0,
                    location: item.location?.address || item.location?.city || item.location || 'Unknown Location',
                    image: imageUrl,
                    vendor: item.vendor?.businessName || 'Verified Vendor'
                });
            });
        });

        return allServices;
    } catch (error) {
        console.error("Failed to fetch packages", error);
        return [];
    }
}

// Helper to get hero image based on category
const getHeroImage = (category) => {
    const images = {
        'trekking': 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=2070&auto=format&fit=crop',
        'homestay': 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=2070&auto=format&fit=crop',
        'camping': 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=2070&auto=format&fit=crop',
        'rafting': 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=2070&auto=format&fit=crop',
        'bungee-jumping': 'https://images.unsplash.com/photo-1521336575822-6da63fb45455?q=80&w=2070&auto=format&fit=crop',
        'chardham-yatra': 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=2070&auto=format&fit=crop',
        'vehicle-rental': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2070&auto=format&fit=crop',
    };
    // Default fallback image
    return images[category?.toLowerCase()] || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop';
};

export default async function PackagesPage({ searchParams }) {
    const { category } = await searchParams || {};
    const services = await getServices(category);

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <PageHero image={getHeroImage(category)} badge={category ? 'Curated Collection' : 'Discover'} title={category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Packages` : <>Explore <span className="text-gradient">Packages</span></>} subtitle={category ? `Hand-picked ${category} experiences from our top verified vendors.` : 'Discover the best experiences curated by top local vendors.'} heightClass="h-[40vh] min-h-[300px]" />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {category && (
                    <div className="mb-6 flex items-center">
                        <Link href="/packages" className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-primary-600 transition-colors group">
                            <svg className="w-4 h-4 mr-1.5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            View All Packages
                        </Link>
                    </div>
                )}
                
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{category ? 'Search Results' : 'Featured Packages'}</h2>
                        <p className="text-gray-500 mt-1 text-sm">Showing {services.length} experiences</p>
                    </div>
                </div>

                {services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {services.map((service) => (
                            <Link href={`/packages/${service._id}`} key={service._id} className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-200 overflow-hidden">
                                <div className="h-56 w-full relative overflow-hidden bg-gray-100">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wide text-gray-900 shadow-sm border border-gray-100">
                                        {service.type}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex items-center space-x-2 text-xs font-medium text-gray-500 mb-2">
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <span className="truncate max-w-[200px]">{service.location}</span>
                                    </div>
                                    
                                    <h3 className="text-xl font-semibold text-gray-900 mb-1 leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">{service.title}</h3>
                                    
                                    <div className="mb-4">
                                        <span className="text-xs text-gray-500">By </span>
                                        <span className="text-xs font-semibold text-gray-700">{service.vendor}</span>
                                    </div>
                                    
                                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Price from</span>
                                            <span className="text-lg font-bold text-gray-900">₹{service.price}</span>
                                        </div>
                                        <div className="inline-flex items-center justify-center px-4 py-2 bg-primary-50 text-primary-700 text-sm font-semibold rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors duration-200">
                                            View Details
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4 border border-gray-100">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found {category && `for ${category}`}</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">We couldn't find any packages matching your criteria right now. Check back later for new adventures.</p>
                        {category && (
                            <Link href="/packages" className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors">
                                Clear Filters
                            </Link>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
