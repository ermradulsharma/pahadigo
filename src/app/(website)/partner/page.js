import PageHero from '@/components/PageHero.js';
import Link from 'next/link';
import { TrendingUp, ShieldCheck, Banknote, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'Partner With Us | PahadiGo Vendor & Host Registration',
    description: 'Grow your Himalayan travel business with PahadiGo. Partner as a verified homestay host, cab operator, trekking guide, or adventure vendor with 0% setup fee.',
    keywords: [
        'Partner with PahadiGo',
        'Himachal Homestay Registration',
        'Himachal Cab Vendor Partner',
        'Trekking Guide Registration',
        'PahadiGo Vendor'
    ],
    openGraph: {
        title: 'Partner With Us | PahadiGo Vendor Network',
        description: 'Reach thousands of travelers seeking authentic Himalayan travel experiences with PahadiGo.',
        url: 'https://pahadigo.co.in/partner',
        siteName: 'PahadiGo',
        type: 'website',
    },
    alternates: {
        canonical: '/partner',
    }
};

export default function PartnerPage() {
    return (
        <div className="bg-[#fcfcfc] min-h-screen pb-24 font-sans selection:bg-primary-500 selection:text-white">
            
            {/* Premium Hero Section */}
            <div className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-gray-900">
                <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1540304473527-774fdbed8e68?q=80&w=2070&auto=format&fit=crop" alt="Partner with us" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
                </div>
                
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-sm">
                                <TrendingUp className="w-4 h-4 text-primary-400 mr-2" />
                                <span className="text-sm font-medium text-white tracking-wide uppercase">Grow With PahadiGo</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6 font-display leading-tight">
                                Turn your passion into a thriving <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">business</span>.
                            </h1>
                            <p className="text-lg md:text-xl text-gray-300 font-medium mb-8 max-w-lg leading-relaxed">
                                Join our network of trusted local homestays, guides, and adventure operators. Reach thousands of travelers seeking authentic Himalayan experiences.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href="#apply" className="inline-flex items-center justify-center px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/30 transform hover:-translate-y-0.5">
                                    Apply Now
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </a>
                                <a href="#benefits" className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md transition-all border border-white/10">
                                    See Benefits
                                </a>
                            </div>
                        </div>
                        
                        {/* Hero Stats/Trust Card */}
                        <div className="hidden lg:block">
                            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-10 shadow-2xl">
                                <h3 className="text-2xl font-bold text-white mb-8">Why hosts love us</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mr-4 border border-primary-500/30">
                                            <Banknote className="w-6 h-6 text-primary-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">0% Setup Fee</p>
                                            <p className="text-gray-400 text-sm">Completely free to list your services.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mr-4 border border-indigo-500/30">
                                            <MapPin className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">Global Reach</p>
                                            <p className="text-gray-400 text-sm">Access travelers from across the country.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mr-4 border border-emerald-500/30">
                                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-lg">Verified Trust</p>
                                            <p className="text-gray-400 text-sm">Build credibility instantly with our badge.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                
                {/* Benefits Section */}
                <div id="benefits" className="text-center mb-16 scroll-mt-24">
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 font-display">Unmatched Benefits</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        We provide you with all the tools you need to manage bookings, communicate with guests, and scale your operations.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
                    <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 hover:border-primary-200 transition-colors group">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Grow Your Business</h3>
                        <p className="text-gray-600 leading-relaxed">Get discovered by thousands of travelers looking for unique, off-the-beaten-path experiences.</p>
                    </div>
                    
                    <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 hover:border-emerald-200 transition-colors group">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Trust</h3>
                        <p className="text-gray-600 leading-relaxed">Being a PahadiGo verified vendor instantly builds trust with travelers regarding safety and quality.</p>
                    </div>

                    <div className="bg-white p-10 rounded-[2rem] shadow-xl shadow-gray-200/40 border border-gray-100 hover:border-purple-200 transition-colors group">
                        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                            <Banknote className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Setup Fees</h3>
                        <p className="text-gray-600 leading-relaxed">Listing your packages and homestays is completely free. We only earn a small commission when you earn.</p>
                    </div>
                </div>

                {/* Application Form */}
                <div id="apply" className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden max-w-5xl mx-auto flex flex-col md:flex-row scroll-mt-24">
                    
                    {/* Form Sidebar */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-10 md:p-14 md:w-2/5 text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black mb-4 font-display">Ready to start?</h3>
                            <p className="text-gray-300 text-lg mb-8">Fill out the form and our partnership team will contact you within 48 hours to begin the verification process.</p>
                            
                            <ul className="space-y-4">
                                <li className="flex items-center">
                                    <CheckCircle2 className="w-5 h-5 text-primary-400 mr-3" />
                                    <span className="text-gray-200 font-medium">Quick 5-minute application</span>
                                </li>
                                <li className="flex items-center">
                                    <CheckCircle2 className="w-5 h-5 text-primary-400 mr-3" />
                                    <span className="text-gray-200 font-medium">Personalized onboarding</span>
                                </li>
                                <li className="flex items-center">
                                    <CheckCircle2 className="w-5 h-5 text-primary-400 mr-3" />
                                    <span className="text-gray-200 font-medium">Dedicated support manager</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Actual Form */}
                    <div className="p-10 md:p-14 md:w-3/5 bg-white">
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Business Name</label>
                                    <input type="text" className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none font-medium" placeholder="e.g. Himalayan Homestays" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Your Name</label>
                                    <input type="text" className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none font-medium" placeholder="John Doe" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Email Address</label>
                                    <input type="email" className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none font-medium" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Phone Number</label>
                                    <input type="tel" className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none font-medium" placeholder="+91 98765 43210" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Business Type</label>
                                <select className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none font-medium appearance-none">
                                    <option>Homestay / Hotel</option>
                                    <option>Trekking / Adventure Guide</option>
                                    <option>Transport Provider</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Brief Description of Services</label>
                                <textarea rows="4" className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none font-medium" placeholder="Tell us about the experiences you offer..."></textarea>
                            </div>

                            <div className="pt-6">
                                <button type="button" className="w-full bg-primary-500 text-white font-black py-4 px-6 rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/30 transform hover:-translate-y-0.5 focus:ring-4 focus:ring-primary-500/20 flex items-center justify-center">
                                    Submit Application
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
