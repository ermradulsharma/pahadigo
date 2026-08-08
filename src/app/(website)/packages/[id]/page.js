import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import PackageBookingForm from '@/app/components/packages/PackageBookingForm.js';
import PackageCard from '@/app/components/packages/PackageCard.js';
import QuickStatsBar from '@/app/components/packages/QuickStatsBar.js';
import connectDB from '@/core/Config/db.js';
import Package from '@/core/Models/Package.js';
import '@/core/Models/Vendor';
import { MapPin, Clock, Mountain, CheckCircle, Info, ShieldCheck, Map, FileText, ShieldAlert, Check, UserCheck, Users, Home as HomeIcon, Key, Car, Fuel } from 'lucide-react';

async function getServiceDetails(id) {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages/${id}`, { cache: 'no-store' });
        if (!res.ok) return null;

        const result = await res.json();
        const service = result.data;

        if (!service) return null;

        return {
            ...service,
            serviceType: service.category || service.serviceType || 'Package',
            vendor: service.vendor || { businessName: 'Verified Vendor' }
        };
    } catch (error) {
        console.error("Failed to fetch package details", error);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { id } = await params;
    const service = await getServiceDetails(id);

    if (!service) {
        return {
            title: 'Package Not Found'
        };
    }

    const defaultTitle = service.roomType || service.campingType || service.trekkingName || service.stretchName || service.jumpName || service.model || service.tourName || service.title || 'Package Details';

    return {
        title: service.seoMetadata?.metaTitle || defaultTitle,
        description: service.seoMetadata?.metaDescription || service.description || '',
        keywords: service.seoMetadata?.keywords?.join(', ') || ''
    };
}

export default async function ServiceDetailPage({ params }) {
    const { id } = await params; // Next.js 15+ needs await on params
    const service = await getServiceDetails(id);

    if (!service) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Service Not Found</h2>
                        <Link href="/packages" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">Back to Packages</Link>
                    </div>
                </div>
            </div>
        );
    }

    // Determine specific fields based on type
    const title = service.title || service.roomType || service.campingType || service.trekkingName || service.stretchName || service.jumpName || service.model || service.tourName;
    const price = service.pricing?.sellingPrice || service.pricing?.basePrice || service.pricePerNight || service.pricePerPerson || service.pricePerDay || 0;

    let imageUrl = '';
    if (service.photos && service.photos.length > 0) {
        imageUrl = service.photos[0].url || service.photos[0];
    }

    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        imageUrl = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop';
    }

    // Fetch Suggestions
    let suggestions = [];
    try {
        const suggRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/packages?limit=5&format=flat`, { cache: 'no-store' });
        if (suggRes.ok) {
            const suggData = await suggRes.json();
            let allPackages = [];

            if (Array.isArray(suggData.data?.items)) {
                allPackages = suggData.data.items;
            } else if (Array.isArray(suggData.data)) {
                allPackages = suggData.data;
            } else if (Array.isArray(suggData.data?.packages)) {
                allPackages = suggData.data.packages;
            } else if (Array.isArray(suggData.data?.data)) {
                allPackages = suggData.data.data;
            } else if (Array.isArray(suggData.items)) {
                allPackages = suggData.items;
            } else if (Array.isArray(suggData.packages)) {
                allPackages = suggData.packages;
            } else {
                // Fallback: Find the first array property in the data object
                const firstArray = Object.values(suggData.data || {}).find(val => Array.isArray(val));
                if (firstArray) allPackages = firstArray;
            }

            suggestions = allPackages.filter(p => (p._id !== id && p.id !== id)).slice(0, 4);
        }
    } catch (err) {
        console.error("Failed to fetch suggestions", err);
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-10 font-sans">
            <Navbar />

            {/* Hero Section */}
            <div className="relative h-[65vh] min-h-[500px] w-full">
                <img src={imageUrl} alt={title} className="w-full h-full object-cover object-center" />
                <div className="absolute inset-0 bg-gray-900/40 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent opacity-90"></div>

                <div className="absolute bottom-0 left-0 w-full px-4 sm:px-6 lg:px-8 pb-24 md:pb-32 text-white z-10">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-5 flex flex-wrap items-center gap-3">
                            <span className="px-4 py-1.5 bg-primary-600/90 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-white shadow-[0_0_15px_rgba(var(--color-primary-600),0.5)]">
                                {service.serviceType || service.category}
                            </span>
                            <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest border border-white/30 shadow-sm">
                                Verified Experience
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-6 leading-tight max-w-4xl tracking-tight font-display drop-shadow-lg">
                            {title}
                        </h1>
                        <p className="text-lg md:text-2xl text-gray-200 flex items-center font-medium drop-shadow-md">
                            <MapPin className="w-6 h-6 mr-3 text-primary-400" />
                            {service.location?.address || service.location || 'Location details unavailable'}
                        </p>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-16 md:-mt-24 top-[7vh]">

                {/* Floating Quick Stats Bar Component */}
                <QuickStatsBar service={service} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-10">

                        {/* About Section */}
                        <section className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center font-display tracking-tight">
                                <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center mr-4">
                                    <Info className="w-5 h-5" />
                                </div>
                                About this Experience
                            </h2>
                            <div className="prose text-gray-600 leading-relaxed text-lg max-w-none">
                                {service.description ? (
                                    <p>{service.description}</p>
                                ) : (
                                    <p>Experience the thrill of {title}. This package is specially curated to offer you an unforgettable journey combining comfort, safety, and breathtaking moments.</p>
                                )}
                            </div>
                        </section>

                        {/* Features/Amenities Grid */}
                        {(service.amenities || service.activitiesIncluded || service.inclusions) && (
                            <section className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100">
                                <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center font-display tracking-tight">
                                    <div className="w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center mr-4 shadow-sm">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    What's Included
                                </h3>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(typeof service.amenities === 'string' ? service.amenities.split(',').map(s => s.trim()) : (service.amenities || service.activitiesIncluded || service.inclusions || [])).map((item, i) => (
                                        <li key={i} className="flex items-center text-gray-700 group bg-gray-50/50 hover:bg-gray-50 border border-gray-100 p-4 rounded-2xl transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
                                            <div className="bg-white text-green-500 rounded-full p-1.5 mr-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                                                <CheckCircle className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-sm">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Itinerary Section */}
                        {service.itinerary && service.itinerary.length > 0 && (
                            <section className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100">
                                <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center font-display tracking-tight">
                                    <div className="w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center mr-4 shadow-sm">
                                        <Map className="w-5 h-5" />
                                    </div>
                                    Itinerary
                                </h3>
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                                    {service.itinerary.map((item, i) => (
                                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Timeline marker */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-primary-100 text-primary-600 font-black shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                {i + 1}
                                            </div>

                                            {/* Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-primary-600">Day {item.day || (i + 1)}</span>
                                                </div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                                                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Policies Section */}
                        {(service.policies?.cancellationPolicy || service.policies?.instructions || service.policies?.medicalCertificate || service.policies?.isCouplesFriendly || service.policies?.isPetFriendly) && (
                            <section className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100">
                                <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center font-display tracking-tight">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center mr-4 shadow-sm">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    Things to Know
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {service.policies?.cancellationPolicy && (
                                        <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100/50">
                                            <h4 className="font-bold text-orange-800 mb-2 flex items-center text-sm uppercase tracking-wide">
                                                <ShieldAlert className="w-4 h-4 mr-2" /> Cancellation Policy
                                            </h4>
                                            <p className="text-sm text-orange-900/80 leading-relaxed">{service.policies.cancellationPolicy}</p>
                                        </div>
                                    )}
                                    {service.policies?.instructions && (
                                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                                            <h4 className="font-bold text-blue-800 mb-2 flex items-center text-sm uppercase tracking-wide">
                                                <Info className="w-4 h-4 mr-2" /> Instructions
                                            </h4>
                                            <p className="text-sm text-blue-900/80 leading-relaxed">{service.policies.instructions}</p>
                                        </div>
                                    )}
                                    {/* Tags */}
                                    <div className="col-span-1 md:col-span-2 flex flex-wrap gap-3 mt-2">
                                        {service.policies?.isCouplesFriendly && <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-pink-50 text-pink-700 text-xs font-bold border border-pink-100"><Check className="w-3.5 h-3.5 mr-1.5" /> Couples Friendly</span>}
                                        {service.policies?.isPetFriendly && <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100"><Check className="w-3.5 h-3.5 mr-1.5" /> Pet Friendly</span>}
                                        {service.policies?.medicalCertificate && <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold border border-red-100"><ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Medical Certificate Req.</span>}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Vendor Profile */}
                        {service.vendor && (
                            <section className="bg-white rounded-[2rem] p-8 md:p-10 shadow-sm border border-gray-100 overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-100/50 to-transparent rounded-bl-full -z-0"></div>
                                <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center font-display tracking-tight relative z-10">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center mr-4 shadow-sm">
                                        <UserCheck className="w-5 h-5" />
                                    </div>
                                    Meet your Host
                                </h3>

                                <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-primary-100 to-primary-200 flex items-center justify-center text-3xl font-black text-primary-700 border-4 border-white shadow-md flex-shrink-0 overflow-hidden">
                                        {service.vendor.profileImage ? (
                                            <img src={service.vendor.profileImage} alt={service.vendor.businessName} className="w-full h-full object-cover" />
                                        ) : (
                                            service.vendor.businessName?.[0] || 'V'
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center flex-wrap gap-2 mb-2">
                                            <h4 className="text-xl font-bold text-gray-900">{service.vendor.businessName || 'Verified Partner'}</h4>
                                            {service.vendor.trustBadge && service.vendor.trustBadge !== 'none' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 text-green-800 text-[10px] font-bold uppercase tracking-wider">
                                                    <ShieldCheck className="w-3 h-3 mr-1" /> {service.vendor.trustBadge.replace('_', ' ')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium mb-4">{service.vendor.profileType || 'Local Business'} • Member since {new Date(service.vendor.createdAt || Date.now()).getFullYear()}</p>
                                        {service.vendor.businessAbout && (
                                            <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">{service.vendor.businessAbout}</p>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                    </div>

                    {/* Sidebar Booking Card */}
                    <div className="lg:col-span-4 relative">
                        <PackageBookingForm service={service} price={price} />
                    </div>
                </div>
            </main>

            {/* Suggested Packages */}
            {suggestions && suggestions.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-8 font-display tracking-tight flex items-center">
                        Similar Experiences
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-3">
                        {suggestions.map((pkg, idx) => (
                            <PackageCard key={pkg._id || pkg.id || idx} service={pkg} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
