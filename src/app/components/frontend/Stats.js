"use client";
import { motion } from 'framer-motion';
import { MapPin, ShieldCheck, Compass, Heart } from 'lucide-react';

const STATS = [
    { label: 'Happy Travelers', value: '50k+', icon: Heart, delay: 0.1 },
    { label: 'Destinations', value: '500+', icon: MapPin, delay: 0.2 },
    { label: 'Verified Vendors', value: '100%', icon: ShieldCheck, delay: 0.3 },
    { label: 'Experiences', value: '50+', icon: Compass, delay: 0.4 },
];

export default function Stats() {
    return (
        <section className="relative z-30 -mt-24 mx-4 md:mx-auto max-w-7xl">
            <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_30px_60px_rgba(0,0,0,0.08)] rounded-[2.5rem] p-8 md:p-10 flex flex-wrap justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary-400/20 rounded-full blur-3xl pointer-events-none"></div>
                {STATS.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: stat.delay }} className="flex-1 flex flex-col xl:flex-row items-center gap-5 text-center xl:text-left group relative z-10 min-w-[150px]">
                            <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-white group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-[0_15px_30px_rgba(79,70,229,0.2)] transition-all duration-500"><Icon className="w-7 h-7 text-primary-600 group-hover:text-secondary-500 transition-colors duration-500" /></div>
                            <div>
                                <h3 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 tracking-tight mb-1">{stat.value}</h3>
                                <p className="text-xs lg:text-sm font-extrabold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                            {idx !== STATS.length - 1 && (
                                <div className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 w-[2px] h-16 bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
