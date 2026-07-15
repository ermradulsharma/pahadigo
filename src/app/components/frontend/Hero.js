"use client";
import { motion, useScroll, useTransform } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Star, Compass } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Hero() {
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 1000], [0, 300]);
    const opacity = useTransform(scrollY, [0, 600], [1, 0]);

    const [location, setLocation] = useState("");
    const [date, setDate] = useState("");
    const [guests, setGuests] = useState("");

    return (
        <section className="relative h-screen min-h-[850px] flex items-center justify-center overflow-hidden">
            <motion.div style={{ y: heroY, opacity: opacity }} className="absolute inset-0 z-0">
                <Image src="/img/background.png" alt="Himalayas Hero Background" fill sizes="100vw" className="object-cover object-[center_30%] scale-105" priority />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/40 to-white z-10" />
            </motion.div>
            <div className="relative z-20 max-w-7xl mx-auto px-4 w-full flex flex-col items-center text-center mt-10">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-[0.2em] uppercase mb-8 shadow-2xl flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.8)]"></span>Discover PahadiGo</motion.div>
                <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white mb-6 tracking-tight leading-[1.05] drop-shadow-2xl">Experience The Mountains <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-secondary-300 to-white">Like Never Before</span></motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-lg md:text-2xl text-gray-200 max-w-3xl font-medium mb-16 drop-shadow-md">Book exclusive treks, luxury homestays, and thrilling expeditions across the Himalayas, handpicked by local experts.</motion.p>
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="w-full max-w-5xl bg-white/10 backdrop-blur-2xl border border-white/20 p-2 md:p-3 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex flex-col md:flex-row gap-2 relative z-30">
                    <div className="flex-1 flex flex-col items-start px-6 py-3 bg-white hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group shadow-sm">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1 group-hover:text-primary-600 transition-colors"><MapPin className="w-3 h-3" /> Where</label>
                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Search destinations" className="w-full bg-transparent border-none outline-none p-0 text-gray-900 placeholder-gray-400 font-bold text-base md:text-lg" />
                    </div>
                    <div className="flex-1 flex flex-col items-start px-6 py-3 bg-white hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group shadow-sm">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1 group-hover:text-primary-600 transition-colors"><Calendar className="w-3 h-3" /> Dates</label>
                        <input type="date" min={new Date().toISOString().split('T')[0]} value={date} onChange={(e) => setDate(e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} className={`w-full bg-transparent border-none outline-none p-0 font-bold text-base md:text-lg cursor-pointer ${date ? 'text-gray-900' : 'text-gray-400'} [&::-webkit-calendar-picker-indicator]:hidden`} />
                    </div>
                    <div className="flex-[1.2] flex items-center justify-between pl-6 pr-2 py-2 bg-white hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group shadow-sm">
                        <div className="flex flex-col items-start w-32">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1 group-hover:text-primary-600 transition-colors"><Users className="w-3 h-3" /> Who</label>
                            <input type="number" min="1" max="20" placeholder="Add guests" value={guests} onChange={(e) => setGuests(e.target.value)} className="w-full bg-transparent border-none outline-none p-0 text-gray-900 placeholder-gray-400 font-bold text-base md:text-lg" />
                        </div>
                        <Link href={`/packages?query=${encodeURIComponent(location)}${date ? `&date=${encodeURIComponent(date)}` : ''}${guests ? `&guests=${encodeURIComponent(guests)}` : ''}`} className="bg-primary-600 hover:bg-primary-700 text-white h-14 px-8 rounded-xl font-bold text-lg transition-all shadow-xl shadow-primary-500/30 flex items-center justify-center gap-2 transform hover:scale-105"><Search className="w-5 h-5" /><span>Search</span></Link>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, duration: 0.8, type: "spring" }} className="absolute top-1/3 right-4 xl:-right-10 hidden lg:flex items-center gap-4 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-2xl">
                    <div className="flex -space-x-3">
                        <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                            <Image src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" alt="User" width={48} height={48} className="w-full h-full object-cover" />
                        </div>
                        <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                            <Image src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100&auto=format&fit=crop" alt="User" width={48} height={48} className="w-full h-full object-cover" />
                        </div>
                        <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">9k+</div>
                    </div>
                    <div className="text-left">
                        <div className="flex items-center text-secondary-400 gap-0.5 mb-1">
                            <Star className="w-3 h-3 fill-secondary-400" />
                            <Star className="w-3 h-3 fill-secondary-400" />
                            <Star className="w-3 h-3 fill-secondary-400" />
                            <Star className="w-3 h-3 fill-secondary-400" />
                            <Star className="w-3 h-3 fill-secondary-400" />
                        </div>
                        <p className="text-white text-sm font-black tracking-wide">Happy Travelers</p>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4, duration: 0.8, type: "spring" }} className="absolute bottom-1/3 left-4 xl:-left-10 hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 px-5 py-3 rounded-2xl shadow-2xl">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg"><Compass className="w-5 h-5 text-primary-600" /></div>
                    <div className="text-left">
                        <p className="text-white text-sm font-black tracking-wide">500+ Destinations</p>
                        <p className="text-gray-300 text-xs font-medium">Ready to explore</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
