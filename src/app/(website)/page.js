import Link from 'next/link';
import Image from 'next/image';
import PageHero from '@/components/PageHero';
import connectDB from '@/config/db';
import Category from '@/models/Category';

// Helper to get consistent images for categories
const getCategoryImage = (slug) => {
    const images = {
        'trekking': 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1000&auto=format&fit=crop',
        'homestay': 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=1000&auto=format&fit=crop',
        'camping': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1000&auto=format&fit=crop',
        'rafting': 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?q=80&w=1000&auto=format&fit=crop',
        'bungee-jumping': 'https://images.unsplash.com/photo-1521336575822-6da63fb45455?q=80&w=1000&auto=format&fit=crop',
        'chardham-yatra': 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?q=80&w=1000&auto=format&fit=crop',
        'vehicle-rental': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop',
    };
    return images[slug] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop';
};

async function getCategories() {
    try {
        await connectDB();
        // Plain object for serialization
        const categories = await Category.find({ isActive: true }).select('name slug description').lean();
        return categories.map(cat => ({
            ...cat,
            _id: cat._id.toString()
        }));
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        return [];
    }
}

export default async function Home() {
    const categories = await getCategories();

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Hero Section */}
            <PageHero
                image="https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?q=80&w=2070&auto=format&fit=crop"
                badge="EXPLORE THE HIMALAYAS"
                title={<>Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">Perfect Escape</span></>}
                subtitle="Curated trekking, camping, and adventure experiences in the heart of nature."
                heightClass="h-screen max-h-[800px]"
            >
                {/* Search Component */}
                <div className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-2xl max-w-2xl mx-auto flex flex-col md:flex-row gap-2 border border-white/50">
                    <div className="flex-1 px-6 py-3 flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Where do you want to go?"
                            className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400 font-medium"
                        />
                    </div>
                    <Link href="/packages" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center">
                        Explore
                    </Link>
                </div>
            </PageHero>

            {/* Stats / Trust Bar */}
            <section className="bg-white border-b border-gray-100 py-8 relative z-20 -mt-10 mx-4 md:mx-auto max-w-6xl rounded-xl shadow-xl flex flex-wrap justify-around gap-8">
                {[
                    { label: 'Happy Travelers', value: '10k+' },
                    { label: 'Destinations', value: '500+' },
                    { label: 'Verified Vendors', value: '100% ' },
                    { label: 'Support', value: '24/7' },
                ].map((stat, idx) => (
                    <div key={idx} className="text-center">
                        <div className="text-3xl font-bold text-gray-900 font-display">{stat.value}</div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
                    </div>
                ))}
            </section>

            {/* Categories Section */}
            <section id="categories" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-gray-900">Browse by Category</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                        From adrenaline-pumping adventures to serene getaways, choose what suits you best.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.length > 0 ? categories.map((cat) => (
                        <Link href={`/packages?category=${cat.slug}`} key={cat._id} className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div className="absolute inset-0">
                                <Image
                                    src={getCategoryImage(cat.slug)}
                                    alt={cat.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                            </div>
                            <div className="absolute bottom-0 left-0 p-8 text-white w-full">
                                <h3 className="text-2xl font-bold mb-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{cat.name}</h3>
                                <p className="text-white/80 line-clamp-2 text-sm opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                                    {cat.description || `Explore the best ${cat.name} packages designed for you.`}
                                </p>
                                <div className="mt-4 flex items-center text-sm font-bold text-indigo-300 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-100">
                                    View Packages <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </div>
                            </div>
                        </Link>
                    )) : (
                        // Skeleton / Empty State
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-80 bg-gray-200 rounded-2xl flex items-center justify-center animate-pulse">
                                <span className="text-gray-400 font-medium">Loading Categories...</span>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Why Us Section */}
            <section className="py-20 bg-indigo-900 text-white rounded-3xl mx-4 lg:mx-8 mb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-700 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-purple-700 rounded-full blur-3xl opacity-50"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl font-bold mb-6 leading-tight">Why Choose PahadiGo?</h2>
                            <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
                                We connect you directly with local experts and vendors, ensuring authentic experiences and the best prices.
                            </p>
                            <ul className="space-y-6">
                                {[
                                    { title: 'Verified Vendors', desc: 'Every service provider is vetted personally.' },
                                    { title: 'Best Prices', desc: 'Get direct prices from local vendors.' },
                                    { title: 'Authentic Experiences', desc: 'Truly local and curated travel memories.' }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/10 mr-4">
                                            <svg className="w-6 h-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold">{item.title}</h4>
                                            <p className="text-indigo-200 text-sm mt-1">{item.desc}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 rotate-3 hover:rotate-0 transition-transform duration-500">
                                <Image src="https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=1000&auto=format&fit=crop" alt="Camping" fill className="object-cover" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Us Section */}
            <section id="about" className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                    <div className="relative">
                        <Image
                            src="https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop"
                            alt="Travelers in Himalayas"
                            width={1000}
                            height={667}
                            className="rounded-2xl shadow-2xl z-10 relative w-full h-auto"
                        />
                        <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary-100 rounded-full z-0"></div>
                        <div className="absolute -top-6 -left-6 w-24 h-24 bg-secondary-500/20 rounded-full z-0"></div>
                    </div>
                    <div>
                        <span className="text-primary-600 font-bold tracking-wider uppercase mb-2 block">About PahadiGo</span>
                        <h2 className="text-4xl font-bold mb-6 text-gray-900 leading-tight">We Are Your Local Guide <br />to the Mountains</h2>
                        <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                            Founded by a group of passionate travelers and locals, PahadiGo aims to bridge the gap between explorers and authentic local experiences. We believe in sustainable tourism that benefits local communities while offering you memories of a lifetime.
                        </p>
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                            Whether you seek the thrill of white-water rafting, the peace of a homestay, or the challenge of a trek, we verify every vendor to ensure safety, quality, and fair pricing.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-4xl font-bold text-gray-900 mb-1">500+</h4>
                                <p className="text-gray-500">Verified Vendors</p>
                            </div>
                            <div>
                                <h4 className="text-4xl font-bold text-gray-900 mb-1">50k+</h4>
                                <p className="text-gray-500">Happy Travelers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mobile App Section */}
            <section className="py-20 bg-indigo-900 text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="md:w-1/2 mb-10 md:mb-0">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display">Adventure in Your Pocket</h2>
                            <p className="text-indigo-200 text-lg mb-8 max-w-lg">
                                Download the PahadiGo app for exclusive mobile-only deals, real-time booking updates, and offline maps for your treks.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a href="#" className="transform hover:-translate-y-1 transition-transform">
                                    <Image src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" width={192} height={64} className="h-16 w-auto" />
                                </a>
                                <a href="#" className="transform hover:-translate-y-1 transition-transform">
                                    <Image src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" width={192} height={64} className="h-16 w-auto" />
                                </a>
                            </div>
                        </div>
                        <div className="md:w-1/2 flex justify-center">
                            {/* Mockup */}
                            <div className="relative w-72 h-[500px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20"></div>
                                <Image src="https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1000&auto=format&fit=crop" alt="App Screen" fill className="object-cover opacity-80" />
                                <div className="absolute bottom-10 left-0 w-full p-4 text-center">
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
                                        <p className="font-bold">Kedarkantha Trek</p>
                                        <p className="text-sm text-gray-300">Starting ₹4,999</p>
                                        <button className="mt-3 w-full bg-indigo-500 text-white text-xs py-2 rounded-lg font-bold">Book Now</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Us Section */}
            <section id="contact" className="py-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-64 -mt-64 w-[500px] h-[500px] bg-primary-50 rounded-full blur-3xl opacity-50 z-0"></div>
                <div className="absolute bottom-0 left-0 -ml-64 -mb-64 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-50 z-0"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-start">
                        {/* Contact Info */}
                        <div>
                            <span className="inline-block py-1 px-3 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-6">
                                Get in Touch
                            </span>
                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display">
                                Let&apos;s Start Your <br /> <span className="text-primary-600">Himalayan Journey</span>
                            </h2>
                            <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-lg">
                                Whether you have a question about our packages, need help with booking, or just want to say hello, our team is ready to answer all your questions.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start">
                                    <div className="w-14 h-14 bg-white shadow-lg shadow-indigo-100 text-primary-600 rounded-2xl flex items-center justify-center mr-6 border border-gray-100 transform transition-transform hover:scale-110">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-1">Visit Us</h4>
                                        <p className="text-gray-500">123, Rajpur Road, Dehradun<br />Uttarakhand, India - 248001</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-14 h-14 bg-white shadow-lg shadow-indigo-100 text-primary-600 rounded-2xl flex items-center justify-center mr-6 border border-gray-100 transform transition-transform hover:scale-110">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-1">Email Us</h4>
                                        <p className="text-gray-500">support@pahadigo.com<br />partners@pahadigo.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="w-14 h-14 bg-white shadow-lg shadow-indigo-100 text-primary-600 rounded-2xl flex items-center justify-center mr-6 border border-gray-100 transform transition-transform hover:scale-110">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-1">Call Us</h4>
                                        <p className="text-gray-500">+91 98765 43210<br />Mon-Fri, 9am - 6pm</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl shadow-gray-200/50 border border-gray-100">
                            <h3 className="text-2xl font-bold text-gray-900 mb-8">Send us a message</h3>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative">
                                        <input type="text" id="name" className="peer w-full border-b-2 border-gray-200 bg-transparent py-3 text-gray-900 placeholder-transparent focus:border-primary-600 focus:outline-none transition-colors" placeholder="Name" />
                                        <label htmlFor="name" className="absolute left-0 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-primary-600">Full Name</label>
                                    </div>
                                    <div className="relative">
                                        <input type="email" id="email" className="peer w-full border-b-2 border-gray-200 bg-transparent py-3 text-gray-900 placeholder-transparent focus:border-primary-600 focus:outline-none transition-colors" placeholder="Email" />
                                        <label htmlFor="email" className="absolute left-0 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-primary-600">Email Address</label>
                                    </div>
                                </div>
                                <div className="relative">
                                    <select id="subject" className="peer w-full border-b-2 border-gray-200 bg-transparent py-3 text-gray-900 focus:border-primary-600 focus:outline-none transition-colors appearance-none">
                                        <option value="" disabled selected>Select a topic</option>
                                        <option>General Inquiry</option>
                                        <option>Support</option>
                                        <option>Vendor Partnership</option>
                                    </select>
                                    <label htmlFor="subject" className="absolute left-0 -top-3.5 text-xs text-gray-500 transition-all peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-primary-600">Subject</label>
                                </div>
                                <div className="relative">
                                    <textarea id="message" rows="4" className="peer w-full border-b-2 border-gray-200 bg-transparent py-3 text-gray-900 placeholder-transparent focus:border-primary-600 focus:outline-none transition-colors resize-none" placeholder="Message"></textarea>
                                    <label htmlFor="message" className="absolute left-0 -top-3.5 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:-top-3.5 peer-focus:text-xs peer-focus:text-primary-600">How can we help?</label>
                                </div>
                                <button type="submit" className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 mt-4">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>


        </div>
    );
}
