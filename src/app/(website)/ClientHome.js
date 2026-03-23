"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, Star, Compass, ArrowRight, ShieldCheck, TrendingUp, Tent, Heart, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

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

const STATS = [
    { label: 'Happy Travelers', value: '50k+', icon: Heart, delay: 0.1 },
    { label: 'Destinations', value: '500+', icon: MapPin, delay: 0.2 },
    { label: 'Verified Vendors', value: '100%', icon: ShieldCheck, delay: 0.3 },
    { label: 'Experiences', value: '50+', icon: Compass, delay: 0.4 },
];

const EXPERIENCES = [
    { title: 'Verified Vendors', desc: 'Every service provider is vetted personally for your safety.', icon: ShieldCheck },
    { title: 'Best Local Prices', desc: 'Get direct prices from local Himalayan vendors without middlemen.', icon: TrendingUp },
    { title: 'Authentic Experiences', desc: 'Truly local and curated travel memories by the locals.', icon: Tent }
];

export default function ClientHome({ categories }) {
    const { scrollY } = useScroll();
    const isClient = typeof window !== 'undefined';
    const heroY = useTransform(scrollY, [0, 1000], [0, 400]);
    const opacity = useTransform(scrollY, [0, 500], [1, 0]);

    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="bg-gray-50 min-h-screen font-sans selection:bg-indigo-500 selection:text-white">
            {/* Dynamic Hero Section */}
            <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
                <motion.div 
                    style={{ y: heroY, opacity: opacity }}
                    className="absolute inset-0 z-0"
                >
                    <Image
                        src="https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?q=80&w=2070&auto=format&fit=crop"
                        alt="Himalayas Hero Background"
                        fill
                        sizes="100vw"
                        className="object-cover object-top scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-50/90 z-10" />
                </motion.div>

                <div className="relative z-20 max-w-7xl mx-auto px-4 w-full flex flex-col items-center text-center mt-20">
                    <motion.span 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-200 text-sm font-bold tracking-widest uppercase mb-6 inline-flex items-center gap-2 shadow-xl"
                    >
                        <Compass className="w-4 h-4" /> Uncover The Himalayas
                    </motion.span>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-[1.1]"
                    >
                        Find Your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-300 to-white">Perfect Escape</span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-2xl text-gray-300 max-w-2xl font-medium mb-12"
                    >
                        Curated trekking, camping, and adventure experiences sourced directly from local experts.
                    </motion.p>

                    <motion.div 
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="w-full max-w-3xl bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 flex flex-col md:flex-row gap-3 hover:shadow-[0_8px_40px_rgba(79,70,229,0.2)] transition-shadow duration-500"
                    >
                        <div className="flex-1 flex items-center px-4 py-2 bg-gray-100/50 rounded-xl hover:bg-gray-100 transition-colors border border-transparent focus-within:border-indigo-300 focus-within:bg-white group">
                            <Search className="w-6 h-6 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Where do you want to go?" 
                                className="w-full bg-transparent border-none outline-none px-4 text-gray-800 placeholder-gray-500 font-medium text-lg"
                            />
                        </div>
                        <Link 
                            href={`/packages${searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ''}`}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 overflow-hidden relative group"
                        >
                            <span className="relative z-10 hidden sm:inline">Explore</span>
                            <span className="relative z-10 sm:hidden">Go</span>
                            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </Link>
                    </motion.div>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 1 }}
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 text-white/50 animate-bounce"
                >
                    <ChevronDown className="w-8 h-8" />
                </motion.div>
            </section>

            {/* Elevated Stats Banner */}
            <section className="relative z-30 -mt-16 mx-4 md:mx-auto max-w-6xl">
                <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-white p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {STATS.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.6, delay: stat.delay }}
                                className="flex flex-col items-center text-center group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                    <Icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h3>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-32 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="text-center mb-20"
                >
                    <h2 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">Choose Your Adventure</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-xl">
                        Discover breathtaking landscapes and thrilling escapades selected for top-tier quality and safety.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories && categories.length > 0 ? categories.map((cat, idx) => (
                        <motion.div
                            key={cat._id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                        >
                            <Link 
                                href={`/packages?category=${cat.slug}`} 
                                className="group relative h-[400px] rounded-[2rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-500 block"
                            >
                                <div className="absolute inset-0">
                                    <Image
                                        src={getCategoryImage(cat.slug)}
                                        alt={cat.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent transition-opacity duration-300 group-hover:from-gray-900/95" />
                                </div>
                                <div className="absolute bottom-0 left-0 p-8 text-white w-full border-t border-white/10 backdrop-blur-[2px] bg-black/10">
                                    <h3 className="text-3xl font-bold mb-3 tracking-wide">{cat.name}</h3>
                                    <p className="text-gray-300 line-clamp-2 text-sm max-w-sm mb-4">
                                        {cat.description || `Explore the best ${cat.name} packages designed for you.`}
                                    </p>
                                    <span className="inline-flex items-center text-sm font-bold text-white bg-indigo-600/90 px-4 py-2 rounded-xl group-hover:bg-indigo-500 transition-colors">
                                        View Experiences <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    )) : (
                        // Skeleton
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-[400px] bg-gray-200 rounded-[2rem] flex items-center justify-center animate-pulse shadow-sm">
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Why Us Parallax Section */}
            <section className="py-32 bg-indigo-950 text-white relative overflow-hidden clip-path-slant my-10">
                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[120px] opacity-30 mix-blend-screen pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-sky-500 rounded-full blur-[120px] opacity-30 mix-blend-screen pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-16">
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="flex-1"
                    >
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 leading-tight tracking-tight">
                            Elevating the way you <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">Experience Travel.</span>
                        </h2>
                        <p className="text-indigo-200 text-xl font-medium mb-12 leading-relaxed max-w-lg">
                            We bypass conventional tourism by connecting you directly with genuine local experts who know the mountains best.
                        </p>
                        
                        <div className="space-y-8">
                            {EXPERIENCES.map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5, delay: i * 0.2 }}
                                        className="flex items-start group"
                                    >
                                        <div className="flex-shrink-0 w-16 h-16 rounded-[1.2rem] bg-indigo-900 border border-indigo-700/50 shadow-inner flex items-center justify-center mr-6 group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-300">
                                            <Icon className="w-8 h-8 text-sky-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold mb-2">{item.title}</h4>
                                            <p className="text-indigo-300 text-base leading-relaxed">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: -2 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="flex-1 relative w-full aspect-[4/5] md:aspect-square"
                    >
                        <div className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/5 z-20">
                            <Image 
                                src="https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop" 
                                alt="Himalayas" 
                                fill 
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover" 
                            />
                            <div className="absolute inset-0 bg-indigo-900/20 mix-blend-multiply"></div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-sky-500 rounded-full mix-blend-screen blur-3xl opacity-50 z-10"></div>
                    </motion.div>
                </div>
            </section>

            {/* Mobile App Section */}
            <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-100 to-transparent rounded-full opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                    
                    <div className="grid md:grid-cols-2 gap-12 items-center p-12 md:p-20 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-indigo-600 font-bold uppercase tracking-widest text-sm mb-4 block">Take us everywhere</span>
                            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-[1.1]">
                                Adventure in Your <br /> Pocket.
                            </h2>
                            <p className="text-gray-600 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
                                Download the PahadiGo app for exclusive mobile-only deals, offline maps for deep treks, and instant booking confirmations.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a href="#" className="transform hover:-translate-y-1 hover:shadow-lg rounded-lg transition-all">
                                    <Image src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" width={170} height={50} className="h-14 w-auto drop-shadow-sm" />
                                </a>
                                <a href="#" className="transform hover:-translate-y-1 hover:shadow-lg rounded-lg transition-all">
                                    <Image src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" width={170} height={50} className="h-14 w-auto drop-shadow-sm" />
                                </a>
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex justify-center"
                        >
                            <div className="relative w-72 h-[550px] bg-white rounded-[3rem] border-[10px] border-gray-900 shadow-2xl overflow-hidden ring-4 ring-gray-900/10 rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-[1rem] z-20"></div>
                                <Image src="https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=1000&auto=format&fit=crop" alt="App Screen" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover z-0" />
                                
                                <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-10 pt-20">
                                    <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-4 shadow-xl">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-bold text-white text-lg leading-tight">Kedarkantha Trek</p>
                                                <p className="text-sm font-medium text-sky-300">Uttarakhand</p>
                                            </div>
                                            <div className="flex items-center text-yellow-400 bg-black/40 px-2 py-1 rounded-lg text-xs font-bold">
                                                <Star className="w-3 h-3 inline mr-1 fill-current" /> 4.9
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div>
                                                <p className="text-xs text-gray-300">Starting from</p>
                                                <p className="font-bold text-white text-lg">₹4,999</p>
                                            </div>
                                            <button className="bg-sky-500 text-white text-sm px-5 py-2 rounded-xl font-bold shadow-lg shadow-sky-500/40">Book</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
