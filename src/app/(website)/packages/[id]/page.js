import Link from 'next/link';
import Navbar from '@/components/Navbar.js';
import connectDB from '@/core/Config/db.js';
import Package from '@/core/Models/Package.js';
import '@/core/Models/Vendor'; // Ensure Vendor model is registered

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

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[55vh] min-h-[400px] w-full border-b border-gray-200">
        <img src={imageUrl} alt={title} className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gray-900/60 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90"></div>
        
        <div className="absolute bottom-0 left-0 w-full px-4 py-10 sm:px-6 lg:px-8 md:py-12 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4 flex items-center space-x-3">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-md text-xs font-bold uppercase tracking-widest border border-white/30 shadow-sm">
                {service.serviceType || service.category}
              </span>
              {(service.difficultyLevel || service.details?.difficulty) && (
                <span className="inline-block px-3 py-1 bg-gray-900/50 backdrop-blur-md rounded-md text-xs font-bold uppercase tracking-widest border border-gray-600 shadow-sm">
                  {service.difficultyLevel || service.details?.difficulty}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight max-w-4xl">{title}</h1>
            <p className="text-lg md:text-xl text-gray-200 flex items-center font-medium">
              <svg className="w-5 h-5 mr-2 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              {service.location?.address || service.location || 'Location details unavailable'}
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* About Section */}
          <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center pb-4 border-b border-gray-100">
              <svg className="w-6 h-6 mr-3 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              About this Experience
            </h2>
            <div className="prose text-gray-600 leading-relaxed max-w-none">
              {service.description ? (
                <p>{service.description}</p>
              ) : (
                <p>Experience the thrill of {title}. This package is specially curated to offer you an unforgettable journey combining comfort, safety, and breathtaking moments.</p>
              )}
            </div>
          </section>

          {/* Features/Amenities Grid */}
          {(service.amenities || service.activitiesIncluded || service.inclusions) && (
            <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center">
                <svg className="w-6 h-6 mr-3 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                What's Included
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                {(typeof service.amenities === 'string' ? service.amenities.split(',').map(s => s.trim()) : (service.amenities || service.activitiesIncluded || service.inclusions || [])).map((item, i) => (
                  <li key={i} className="flex items-start text-gray-700 group">
                    <div className="bg-primary-50 text-primary-600 rounded-md p-1 mt-0.5 mr-3 group-hover:bg-primary-100 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-medium text-sm leading-snug">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Additional Details Boxes */}
          {(service.duration || service.details?.duration || service.difficultyLevel || service.details?.difficulty) && (
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(service.duration || service.details?.duration) && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <span className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Duration
                  </span>
                  <span className="text-xl font-bold text-gray-900">{service.duration || service.details?.duration}</span>
                </div>
              )}
              {(service.difficultyLevel || service.details?.difficulty) && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <span className="flex items-center text-gray-500 text-xs font-bold uppercase tracking-widest mb-1.5">
                    <svg className="w-4 h-4 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Difficulty
                  </span>
                  <span className="text-xl font-bold text-gray-900">{service.difficultyLevel || service.details?.difficulty}</span>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar Booking Card */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-200 flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Pricing</p>
              <div className="text-4xl font-bold text-gray-900 mb-1">₹{price}</div>
              <p className="text-gray-500 text-sm font-medium">per person / night</p>
            </div>
            
            <div className="p-6 space-y-6">
              {service.vendor && (
                <div className="flex items-center space-x-4 pb-6 border-b border-gray-100">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold text-gray-500 border border-gray-200">
                    {service.vendor.businessName?.[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-0.5">Provided by</p>
                    <p className="font-bold text-gray-900 text-base">{service.vendor.businessName}</p>
                  </div>
                </div>
              )}

              <button className="w-full bg-primary-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:outline-none flex items-center justify-center group">
                Enquire Availability
                <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              
              <div className="bg-blue-50 rounded-lg p-4 flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Booking directly with the vendor ensures you get the best rates. Contact them for available dates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
