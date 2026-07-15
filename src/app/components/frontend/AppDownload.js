"use client";
import { motion } from 'framer-motion';
import { DownloadCloud, CheckCircle, Home, Compass, User, Wifi, Battery, Signal, Heart, MapPin, Search, Star } from 'lucide-react';
import Image from 'next/image';

export default function AppDownload() {
    return (
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <div className="relative rounded-[3rem] bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl overflow-hidden border border-gray-700">

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="grid lg:grid-cols-2 gap-12 items-center p-10 md:p-16 lg:p-20 relative z-10">

                    {/* Left Content */}
                    <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-white">
                        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 shadow-sm">
                            <DownloadCloud className="w-4 h-4 text-primary-400" />
                            <span className="text-xs font-bold uppercase tracking-widest text-primary-400">App Coming Soon</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight">The Mountains, <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">In Your Pocket.</span></h2>
                        <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-lg leading-relaxed font-medium">Access exclusive app-only deals, offline trekking maps, and 24/7 on-ground support with the all-new PahadiGo app.</p>
                        <ul className="space-y-4 mb-10">
                            {['Offline Trail Maps', 'Instant Booking Confirmations', 'Priority Local Support'].map((feature, i) => (
                                <li key={i} className="flex items-center text-gray-200 font-medium text-lg">
                                    <CheckCircle className="w-5 h-5 text-secondary-400 mr-3 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-wrap gap-4">
                            <a href="#" className="transform hover:-translate-y-1 hover:shadow-xl rounded-xl transition-all bg-white/5 backdrop-blur-md overflow-hidden group border rounded-3xl"><Image src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" width={170} height={50} className="h-14 w-auto opacity-90 group-hover:opacity-100 transition-opacity" /></a>
                            <a href="#" className="transform hover:-translate-y-1 hover:shadow-xl rounded-xl transition-all bg-white/5 backdrop-blur-md overflow-hidden group border rounded-3xl"><Image src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" width={170} height={50} className="h-14 w-auto opacity-90 group-hover:opacity-100 transition-opacity" /></a>
                        </div>
                    </motion.div>

                    {/* Right Mockup */}
                    <motion.div initial={{ opacity: 0, y: 100 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="relative flex justify-center lg:justify-end lg:mt-20 mt-10">
                        <div className="relative w-[280px] h-[580px] bg-gray-900 rounded-[3rem] border-8 border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 overflow-hidden transform lg:-rotate-6 hover:rotate-0 transition-transform duration-700">
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-7 bg-gray-800 rounded-b-2xl z-30"></div>
                            <div className="absolute inset-0 bg-gray-50 z-10 flex flex-col overflow-hidden">
                                <div className="h-7 w-full bg-primary-600 flex justify-between items-end px-5 pb-1 text-white z-40">
                                    <span className="text-[10px] font-bold">9:41</span>
                                    <div className="flex items-center gap-1.5">
                                        <Signal className="w-3 h-3" />
                                        <Wifi className="w-3 h-3" />
                                        <Battery className="w-3 h-3" />
                                    </div>
                                </div>

                                {/* App Header */}
                                <div className="bg-primary-600 pt-2 pb-5 px-5 text-white rounded-b-3xl shadow-sm z-30">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <p className="text-primary-100 text-xs mb-0.5">Location</p>
                                            <div className="flex items-center text-sm font-bold"><MapPin className="w-3 h-3 mr-1" /> Uttarakhand, IN</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><User className="w-4 h-4" /></div>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="w-full h-10 bg-white rounded-xl shadow-sm flex items-center px-4 text-gray-400">
                                        <Search className="w-4 h-4" />
                                        <span className="text-xs ml-2 font-medium">Search treks, camps...</span>
                                    </div>
                                </div>

                                {/* App Body */}
                                <div className="flex-1 p-4 space-y-4 overflow-y-auto relative z-20 pb-20 mt-2" style={{ scrollbarWidth: 'none' }}>

                                    {/* Categories */}
                                    <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                                        <div className="px-4 py-1.5 bg-primary-600 text-white text-[11px] font-bold rounded-full whitespace-nowrap">All</div>
                                        <div className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full whitespace-nowrap">Homestay</div>
                                        <div className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full whitespace-nowrap">Hotel</div>
                                        <div className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full whitespace-nowrap">Camping</div>
                                        <div className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full whitespace-nowrap">Trekking</div>
                                        <div className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full whitespace-nowrap">Rafting</div>
                                        <div className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full whitespace-nowrap">Bungee Jumping</div>
                                        <div className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full whitespace-nowrap">Chaardham Tour</div>
                                        <div className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full whitespace-nowrap">Bike/Scooter Rental</div>
                                        <div className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-[11px] font-medium rounded-full whitespace-nowrap">Custom Trip</div>
                                    </div>

                                    {/* Section Title */}
                                    <div className="flex justify-between items-center pt-2">
                                        <h5 className="font-bold text-sm text-gray-900">Popular Now</h5>
                                        <span className="text-[11px] text-primary-600 font-bold">See all</span>
                                    </div>

                                    {/* Card 1 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/trekking.png" fill sizes="250px" className="object-cover" alt="Trekking" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 4.9
                                            </div>
                                            <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                                                <Heart className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">Kedarkantha Trek</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">4 Days • 3 Nights</p>
                                                <p className="text-xs font-bold text-primary-600">₹4,999</p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 2 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/camping.png" fill sizes="250px" className="object-cover" alt="Camping" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 4.8
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">Riverside Camping</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Rishikesh</p>
                                                <p className="text-xs font-bold text-primary-600">₹1,499</p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 3 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/rafting.png" fill sizes="250px" className="object-cover" alt="Rafting" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 4.7
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">White Water Rafting</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Ganga River</p>
                                                <p className="text-xs font-bold text-primary-600">₹999 <span className="text-gray-400">/ person</span></p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 4 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/homestay.png" fill sizes="250px" className="object-cover" alt="Homestay" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 4.9
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">Mountain Homestay</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Manali</p>
                                                <p className="text-xs font-bold text-primary-600">₹2,499 <span className="text-gray-400">/ night</span></p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 5 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/paragliding.png" fill sizes="250px" className="object-cover" alt="Paragliding" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 4.9
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">Tandem Paragliding</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Bir Billing</p>
                                                <p className="text-xs font-bold text-primary-600">₹2,999 <span className="text-gray-400">/ flight</span></p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 6 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/hotel.png" fill sizes="250px" className="object-cover" alt="Hotel" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 4.8
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">Luxury Himalayan Hotel</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Mussoorie</p>
                                                <p className="text-xs font-bold text-primary-600">₹5,499 <span className="text-gray-400">/ night</span></p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 7 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/bungee-jumping.png" fill sizes="250px" className="object-cover" alt="Bungee Jumping" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 4.9
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">Extreme Bungee Jump</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Rishikesh</p>
                                                <p className="text-xs font-bold text-primary-600">₹3,500 <span className="text-gray-400">/ jump</span></p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 8 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/vehicle-rental.png" fill sizes="250px" className="object-cover" alt="Vehicle Rental" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 4.7
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">4x4 SUV Rental</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Dehradun</p>
                                                <p className="text-xs font-bold text-primary-600">₹2,500 <span className="text-gray-400">/ day</span></p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 9 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/chardham-yatra.png" fill sizes="250px" className="object-cover" alt="Char Dham Yatra" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 5.0
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">Char Dham Yatra</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Uttarakhand</p>
                                                <p className="text-xs font-bold text-primary-600">₹18,000</p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 10 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/skiing.png" fill sizes="250px" className="object-cover" alt="Skiing" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 4.8
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">Auli Skiing</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Auli</p>
                                                <p className="text-xs font-bold text-primary-600">₹4,200</p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>

                                    {/* Card 11 */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                                        <div className="h-32 relative">
                                            <Image src="/img/category/custom-trip.png" fill sizes="250px" className="object-cover" alt="Custom Trip" />
                                            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-bold text-gray-900 flex items-center shadow-sm">
                                                <Star className="w-3 h-3 mr-1 text-yellow-500 fill-yellow-500" /> 5.0
                                            </div>
                                        </div>
                                        <div className="p-3 flex justify-between items-end">
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">Custom VIP Tour</h5>
                                                <p className="text-[10px] text-gray-500 mb-1">Himalayas</p>
                                                <p className="text-xs font-bold text-primary-600">Get Quote</p>
                                            </div>
                                            <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-sm">Book</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Navigation Bar */}
                                <div className="absolute bottom-0 w-full h-16 bg-white border-t border-gray-100 flex justify-around items-center px-2 z-30 pb-2">
                                    <div className="flex flex-col items-center justify-center text-primary-600 mt-1">
                                        <Home className="w-5 h-5 mb-1" />
                                        <div className="w-1 h-1 bg-primary-600 rounded-full"></div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Compass className="w-5 h-5 mb-1" />
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Heart className="w-5 h-5 mb-1" />
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <User className="w-5 h-5 mb-1" />
                                    </div>
                                </div>
                            </div>

                            {/* Inner gradient to simulate screen brightness */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent z-20 pointer-events-none"></div>
                        </div>

                        {/* Floating Notification */}
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-1/4 -left-10 lg:-left-16 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl hidden md:block z-30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-400" /></div>
                                <div>
                                    <p className="text-white text-sm font-bold">Booking Confirmed</p>
                                    <p className="text-gray-300 text-xs">Kedarkantha Trek</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
