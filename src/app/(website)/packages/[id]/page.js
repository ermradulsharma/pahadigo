import Link from 'next/link';
import Navbar from '@/components/Navbar';
import connectDB from '@/config/db';
import Package from '@/models/Package';
import '@/models/Vendor'; // Ensure Vendor model is registered

async function getServiceDetails(id) {
    await connectDB();

    // Find the package that contains a service with this ID
    const serviceTypes = [
        'homestay', 'camping', 'trekking', 'rafting',
        'bungeeJumping', 'vehicleRental', 'chardhamTour'
    ];

    const orConditions = serviceTypes.map(type => ({
        [`services.${type}._id`]: id
    }));

    const pkg = await Package.findOne({ $or: orConditions }).populate('vendor').lean();

    if (!pkg) return null;

    // Find the specific sub-document
    let foundService = null;
    let serviceType = '';

    for (const type of serviceTypes) {
        if (pkg.services && pkg.services[type]) {
            const item = pkg.services[type].find(s => s._id.toString() === id);
            if (item) {
                foundService = item;
                serviceType = type;
                break;
            }
        }
    }

    if (!foundService) return null;

    return {
        ...foundService,
        _id: foundService._id.toString(),
        serviceType,
        vendor: pkg.vendor
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
    const title = service.roomType || service.campingType || service.trekkingName || service.stretchName || service.jumpName || service.model || service.tourName;
    const price = service.pricePerNight || service.pricePerPerson || service.pricePerDay;
    const image = service.photos?.[0] || 'https://images.unsplash.com/photo-1590664095641-7fa05f29928e?q=80&w=1000&auto=format&fit=crop';

    return (
        <div className="bg-white min-h-screen">
            <Navbar />

            {/* Hero Image */}
            <div className="relative h-[60vh] min-h-[400px]">
                <img src={image} alt={title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 text-white">
                    <div className="max-w-7xl mx-auto">
                        <span className="inline-block px-3 py-1 bg-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider mb-4">
                            {service.serviceType}
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 font-display">{title}</h1>
                        <p className="text-xl md:text-2xl text-white/90 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {service.location}
                        </p>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    {/* Description Section */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Activity</h2>
                        <div className="prose prose-lg text-gray-600">
                            {/* Add description logic if it exists in schema, otherwise generic */}
                            <p>Experience the thrill of {title} in {service.location}. This package is curated to offer you the best experience with safety and comfort.</p>
                        </div>
                    </section>

                    {/* Features/Amenities */}
                    {(service.amenities || service.activitiesIncluded || service.inclusions) && (
                        <section>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">What`s Included</h3>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(service.amenities || service.activitiesIncluded || service.inclusions || []).map((item, i) => (
                                    <li key={i} className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg">
                                        <svg className="w-5 h-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Additional Details */}
                    <section className="grid grid-cols-2 gap-6">
                        {service.duration && (
                            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                <span className="block text-indigo-500 text-sm font-bold uppercase mb-1">Duration</span>
                                <span className="text-xl font-bold text-gray-900">{service.duration}</span>
                            </div>
                        )}
                        {service.difficultyLevel && (
                            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                <span className="block text-orange-500 text-sm font-bold uppercase mb-1">Difficulty</span>
                                <span className="text-xl font-bold text-gray-900">{service.difficultyLevel}</span>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar Booking Card */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="p-6 bg-indigo-600 text-white">
                            <p className="text-sm opacity-90 mb-1">Price starts at</p>
                            <div className="text-4xl font-bold">₹{price}</div>
                            <p className="text-sm opacity-75">per person/night</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {service.vendor && (
                                <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-500">
                                        {service.vendor.businessName?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Provided by</p>
                                        <p className="font-bold text-gray-900">{service.vendor.businessName}</p>
                                    </div>
                                </div>
                            )}

                            <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/30">
                                Enquire Now
                            </button>
                            <p className="text-xs text-center text-gray-400">
                                Contact vendor for availability.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
