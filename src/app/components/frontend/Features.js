"use client";
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, Tent, LifeBuoy } from 'lucide-react';
import Image from 'next/image';

const EXPERIENCES = [
    { title: 'Unscripted Adventures', desc: 'No boring itineraries. Dive into raw, unfiltered experiences crafted by locals who know the mountains inside out.', icon: Tent },
    { title: 'Zero Hidden Costs', desc: 'Say goodbye to greedy middlemen. Get direct, honest pricing straight from the local hosts and guides.', icon: TrendingUp },
    { title: '100% Verified & Safe', desc: 'Your safety is our obsession. Every vendor is strictly vetted so you can focus entirely on the thrill.', icon: ShieldCheck },
    { title: '24/7 Local Support', desc: 'No matter how deep in the mountains you go, our dedicated on-ground team is always just a call away.', icon: LifeBuoy }
];

export default function Features() {
    return (
        <section className="relative py-32 mt-16 xl:mt-24 w-full">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <Image src="/img/features.png" alt="Local Himalayan Expert" fill className="object-cover object-center transform scale-105" />
                <div className="absolute inset-0 bg-gray-900/80"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-gray-50"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }} className="max-w-3xl mb-20">
                    <span className="text-primary-400 font-bold tracking-widest uppercase text-sm mb-4 block drop-shadow-md">Why PahadiGo</span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tight">Don't Just Travel. <br /> <span className="text-primary-400">Experience the Himalayas.</span></h2>
                    <p className="text-gray-300 text-lg md:text-xl font-medium leading-relaxed drop-shadow-sm">Ditch the tourist traps. We connect you directly with passionate local experts to unlock authentic adventures, hidden trails, and unforgettable memories.</p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    {EXPERIENCES.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: i * 0.2 }} className="group relative rounded-[1rem] p-2 md:p-4 text-left overflow-hidden bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-colors duration-500 shadow-2xl">
                                {/* <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl group-hover:bg-primary-500/40 transition-colors duration-500"></div> */}
                                <div className="text-center w-16 h-16 rounded-2xl bg-white/10 text-primary-400 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-400 transition-all duration-300 shadow-lg"><Icon className="w-8 h-8" /></div>
                                <h4 className="text-2xl font-bold mb-4 text-white">{item.title}</h4>
                                <p className="text-gray-300 text-base leading-relaxed font-medium">{item.desc}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
