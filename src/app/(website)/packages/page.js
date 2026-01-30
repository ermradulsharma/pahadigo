import Link from 'next/link';
import Image from 'next/image';
import PageHero from '@/components/PageHero';

import connectDB from '@/config/db';
import Package from '@/models/Package';
import { Suspense } from 'react';

// Helper to extract services and filter by category
const flattenServices = (vendorPackages, category = null) => {
    let allServices = [];
    vendorPackages.forEach(pkg => {
        const vendorName = pkg.vendor?.businessName || 'Verified Vendor';

        const serviceTypes = [
            'homestay', 'camping', 'trekking', 'rafting',
            'bungeeJumping', 'vehicleRental', 'chardhamTour'
        ];

        serviceTypes.forEach(type => {
            // If category is specified, only include matching types
            if (category && type.toLowerCase() !== category.toLowerCase()) return;

            if (pkg.services && pkg.services[type]) {
                pkg.services[type].forEach(item => {
                    if (item.isActive) {
                        allServices.push({
                            _id: item._id.toString(),
                            type,
                            title: item.roomType || item.campingType || item.trekkingName || item.stretchName || item.jumpName || item.model || item.tourName,
                            price: item.pricePerNight || item.pricePerPerson || item.pricePerDay,
                            location: item.location,
                            // Use a reliable placeholder image if correct one is missing
                            image: item.photos?.[0] || 'https://images.unsplash.com/photo-1590664095641-7fa05f29928e?q=80&w=1000&auto=format&fit=crop',
                            vendor: vendorName
                        });
                    }
                });
            }
        });
    });
    return allServices;
};

async function getServices(category) {
    try {
        const conn = await connectDB();
        if (!conn) return [];
        // Populate vendor to get name
        const packages = await Package.find().populate('vendor', 'businessName').lean();
        return flattenServices(packages, category);
    } catch (error) {
        console.error("Error fetching packages:", error);
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
        <div className="bg-gray-50 min-h-screen">
            <PageHero image={getHeroImage(category)} badge={category ? 'Curated Collection' : 'Discover'} title={category ? `${category.charAt(0).toUpperCase() + category.slice(1)} Packages` : <>Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">Packages</span></>} subtitle={category ? `Hand-picked ${category} experiences from our top verified vendors.` : 'Discover the best experiences curated by top local vendors.'} heightClass="h-[50vh] min-h-[400px]" />
            <main className="max-w-7xl mx-auto px-4 py-12">
                {category && (
                    <div className="mb-8">
                        <Link href="/packages" className="text-indigo-600 font-medium hover:underline flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            View All Packages
                        </Link>
                    </div>
                )}
                {services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service) => (
                            <Link href={`/packages/${service._id}`} key={service._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
                                <div className="h-56 overflow-hidden relative">
                                    <Image
                                        src={service.image}
                                        alt={service.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-indigo-600">
                                        {service.type}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{service.title}</h3>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-4 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {service.location}
                                    </p>
                                    <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                                        <div>
                                            <span className="text-xs text-gray-500 block">Starting from</span>
                                            <span className="text-lg font-bold text-gray-900">₹{service.price}</span>
                                        </div>
                                        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                            View Details
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No packages found {category && `for ${category}`}</h3>
                        <p className="text-gray-500">Check back later for new adventures.</p>
                        {category && (
                            <Link href="/packages" className="mt-4 inline-block text-indigo-600 font-bold hover:underline">
                                View all packages
                            </Link>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
