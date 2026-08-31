import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, MapPin, ChevronRight } from 'lucide-react';

export default function PackageCard({ service = {} }) {
    // Safely extract scalar props to prevent React child rendering errors
    const id = service._id || service.id;
    const title = service.title;
    const type = typeof service.category === 'string' ? service.category : service.categoryName;
    const location = typeof service.location === 'string' ? service.location : service.address;
    const price = typeof service.pricing === 'number' ? service.pricing : Math.round((service.pricing?.basePrice * (1 + (service.pricing?.gst / 100)) + Number.EPSILON) * 100) / 100 || 0;

    // Map image strictly from `photos` array in the model
    let imageSrc = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop';

    if (service.photos && Array.isArray(service.photos) && service.photos.length > 0) {
        if (service.photos[0]?.url && service.photos[0].url.trim() !== '') {
            imageSrc = service.photos[0].url;
        } else if (typeof service.photos[0] === 'string' && service.photos[0].trim() !== '') {
            imageSrc = service.photos[0];
        }
    } else if (typeof service.photos === 'string' && service.photos.trim() !== '') {
        imageSrc = service.photos;
    } else if (service.photos && typeof service.photos === 'object' && service.photos.url) {
        imageSrc = service.photos.url;
    }

    return (
        <Link href={`/packages/${id}`} className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-200/60 overflow-hidden transition-all duration-300 hover:-translate-y-1">
            <div className="aspect-[4/3] w-full relative overflow-hidden bg-gray-100">
                <Image src={imageSrc} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out" loading="eager" />
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-gray-900 shadow-sm border border-white/20">{type}</div>
                <div className="absolute top-4 right-4 p-2 bg-white/60 backdrop-blur-md rounded-full text-gray-600 hover:bg-white hover:text-rose-500 hover:shadow-md transition-all duration-200 z-10"><Heart className="w-4 h-4" /></div>
            </div>
            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors font-display">{title}</h3>
                    <div className="flex items-center space-x-1 shrink-0 bg-gray-900 px-2 py-1 rounded-lg"><Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /><span className="text-xs font-bold text-white">4.8</span></div>
                </div>

                <div className="flex items-center space-x-1.5 text-sm text-gray-500 mb-4">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate font-medium">{location}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Starting from</div>
                        <div className="flex items-baseline space-x-1">
                            <span className="text-xl font-extrabold text-gray-900">₹{price}</span>
                            <span className="text-xs text-gray-500 font-medium">/ person</span>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></div>
                </div>
            </div>
        </Link>
    );
}
