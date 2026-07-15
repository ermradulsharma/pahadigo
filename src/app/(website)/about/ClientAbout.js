"use client";
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ShieldCheck, Compass, Users } from 'lucide-react';

export default function ClientAbout() {
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 1000], [0, 300]);
    const opacity = useTransform(scrollY, [0, 600], [1, 0]);

    return (
        <div className="bg-gray-50 min-h-screen pb-20 font-sans">
            
            {/* Cinematic Hero Section */}
            <section className="relative h-[60vh] min-h-[550px] flex items-center justify-center overflow-hidden">
                <motion.div style={{ y: heroY, opacity: opacity }} className="absolute inset-0 z-0">
                    <Image 
                        src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=2074&auto=format&fit=crop" 
                        alt="Himalayan Mountains" 
                        fill 
                        sizes="100vw" 
                        className="object-cover object-[center_30%] scale-105" 
                        priority 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/40 to-gray-50 z-10" />
                </motion.div>
                
                <div className="relative z-20 max-w-7xl mx-auto px-4 w-full flex flex-col items-center text-center mt-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold tracking-[0.2em] uppercase mb-8 shadow-2xl flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-secondary-400 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.8)]"></span>
                        Our Story
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl lg:text-[5.5rem] font-black text-white mb-6 tracking-tight leading-[1.05] drop-shadow-2xl">
                        About <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-secondary-300 to-white">
                            PahadiGo
                        </span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-2xl text-gray-200 max-w-3xl font-medium drop-shadow-md">
                        Your trusted partner for authentic Himalayan adventures and curated local experiences.
                    </motion.p>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-8 relative z-30">
                
                {/* Mission Section */}
                <motion.section 
                    initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
                    className="bg-white/80 backdrop-blur-3xl rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.08)] border border-white/60 p-8 md:p-12 lg:p-16 mb-24 relative overflow-hidden">
                    
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-400/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary-400/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
                        <div>
                            <span className="text-primary-600 font-black tracking-widest uppercase text-xs mb-3 block">Our Mission</span>
                            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                                Empowering Local Explorers & Communities
                            </h2>
                            <div className="space-y-5 text-gray-600 font-medium text-lg leading-relaxed">
                                <p>
                                    PahadiGo was born out of a profound love for the mountains. We noticed a gap between passionate local vendors offering incredible, authentic experiences, and travelers struggling to find them.
                                </p>
                                <p>
                                    By providing a robust platform for local homestays, adventure guides, and transport providers, we aim to boost local economies while giving travelers an unforgettable, safe, and curated journey into the Himalayas.
                                </p>
                            </div>
                        </div>
                        <div className="relative h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white transform lg:rotate-2 hover:rotate-0 transition-transform duration-500">
                            <Image 
                                src="https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop" 
                                alt="Mountain landscape" 
                                fill 
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    </div>
                </motion.section>

                {/* Values Grid */}
                <section className="mb-24">
                    <div className="text-center mb-16">
                        <motion.span 
                            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                            className="text-primary-600 font-black tracking-widest uppercase text-xs mb-3 block">Why Choose Us</motion.span>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">The standards we live by</motion.h2>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                            className="text-gray-500 mt-6 max-w-2xl mx-auto text-lg font-medium">The principles that guide everything we build and every partner we onboard.</motion.p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
                            className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-white hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] hover:bg-white transition-all duration-300 group">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-white rounded-2xl flex items-center justify-center mb-8 text-primary-600 shadow-sm border border-primary-100 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-4">Trust & Safety</h3>
                            <p className="text-gray-600 font-medium leading-relaxed">
                                Every vendor is strictly vetted. We ensure that safety standards are met so you can focus on the adventure with complete peace of mind.
                            </p>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-white hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] hover:bg-white transition-all duration-300 group">
                            <div className="w-16 h-16 bg-gradient-to-br from-secondary-50 to-white rounded-2xl flex items-center justify-center mb-8 text-secondary-500 shadow-sm border border-secondary-100 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                <Compass className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-4">Authenticity</h3>
                            <p className="text-gray-600 font-medium leading-relaxed">
                                Skip the generic tourist traps. We connect you directly with locals to give you a genuine taste of Pahadi life and culture.
                            </p>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
                            className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.03)] border border-white hover:-translate-y-2 hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] hover:bg-white transition-all duration-300 group">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-white rounded-2xl flex items-center justify-center mb-8 text-primary-600 shadow-sm border border-primary-100 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-4">Community First</h3>
                            <p className="text-gray-600 font-medium leading-relaxed">
                                We prioritize the economic empowerment of mountain communities over sheer corporate profit. When they thrive, we thrive.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Stats Section */}
                <motion.section 
                    initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                    className="bg-gray-900 rounded-[3rem] p-12 lg:p-16 text-white shadow-2xl mb-24 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
                        <div>
                            <h4 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-300 to-primary-500 mb-2">10k+</h4>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Happy Travelers</p>
                        </div>
                        <div>
                            <h4 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-secondary-300 to-secondary-500 mb-2">500+</h4>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Local Guides</p>
                        </div>
                        <div>
                            <h4 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-primary-300 to-primary-500 mb-2">100%</h4>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Verified Partners</p>
                        </div>
                        <div>
                            <h4 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-secondary-300 to-secondary-500 mb-2">4.9</h4>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Average Rating</p>
                        </div>
                    </div>
                </motion.section>

                {/* CTA / Final Block */}
                <motion.section 
                    initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                    className="relative rounded-[3rem] overflow-hidden shadow-2xl">
                    <Image 
                        src="/img/background.png" 
                        alt="CTA Background" 
                        fill 
                        className="object-cover object-bottom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-primary-800/80 backdrop-blur-sm" />
                    
                    <div className="relative z-10 px-8 py-20 md:py-24 text-center max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-xl">
                            Ready to start exploring?
                        </h2>
                        <p className="text-primary-100 mb-10 text-xl font-medium drop-shadow-md">
                            Browse our curated list of packages and find your next breathtaking adventure today.
                        </p>
                        <Link href="/packages" className="inline-flex items-center justify-center bg-white text-primary-700 font-black text-lg py-5 px-10 rounded-2xl hover:scale-105 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all duration-300 group">
                            View Packages
                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </Link>
                    </div>
                </motion.section>
                
            </main>
        </div>
    );
}
