import Link from 'next/link';
import PageHero from '@/components/PageHero.js';

export const metadata = {
    title: 'Careers | PahadiGo - Build the Future of Himalayan Travel',
    description: 'Join PahadiGo team and help build authentic, sustainable travel experiences across the Himalayas. Remote-first opportunities in engineering, marketing, operations, and product.',
    keywords: [
        'PahadiGo Careers',
        'Travel Tech Jobs India',
        'Remote Jobs Himachal',
        'PahadiGo Hiring'
    ],
    openGraph: {
        title: 'Careers | PahadiGo',
        description: 'Build the future of authentic Himalayan travel with PahadiGo.',
        url: 'https://pahadigo.co.in/careers',
        siteName: 'PahadiGo',
        type: 'website',
    },
    alternates: {
        canonical: '/careers',
    }
};

export default function Careers() {
    return (
        <div className="bg-gray-50 min-h-screen font-sans selection:bg-primary-500 selection:text-white">
            {/* Custom Animated Hero */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop" 
                        alt="PahadiGo Team" 
                        className="w-full h-full object-cover opacity-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-gray-50"></div>
                </div>
                
                {/* Animated Gradient Orbs */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary-100 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-secondary-500/20 rounded-full blur-[100px] opacity-60"></div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-600 font-medium text-sm tracking-wide">
                        Join Our Team
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                        Build the Future of <br className="hidden md:block" />
                        <span className="text-gradient">Travel with Us</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        We are bringing the Himalayas closer to the world. Join us in our mission to create authentic, sustainable, and unforgettable travel experiences.
                    </p>
                </div>
            </div>

            {/* Why Join Us Section */}
            <div className="py-24 bg-gray-50">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why PahadiGo?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">More than just a workplace, we are a community of adventurers and builders.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Perk 1 */}
                        <div className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Work from Anywhere</h3>
                            <p className="text-gray-600 leading-relaxed">
                                We are a remote-first team. Work from the comfort of your home, or better yet, from a homestay in the mountains.
                            </p>
                        </div>

                        {/* Perk 2 */}
                        <div className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-secondary-500/10 text-secondary-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Adventure Perks</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Enjoy exclusive discounts on our curated trips, treks, and homestays. We want you to experience what we build.
                            </p>
                        </div>

                        {/* Perk 3 */}
                        <div className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">Impact Driven</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Everything we do helps local Himalayan communities thrive sustainably. Your work directly impacts lives.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Section */}
            <div className="py-24 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 bg-primary-600"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary-500/30 rounded-full blur-[120px] mix-blend-overlay"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-400/30 rounded-full blur-[100px] mix-blend-overlay"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-8 border border-white/30 shadow-inner">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white">No Open Positions Currently</h2>
                        <p className="text-white/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                            While our team is currently full, we're always on the lookout for exceptional talent. If you believe you belong here, don't wait for an opening.
                        </p>
                        
                        <a 
                            href="mailto:careers@pahadigo.co.in" 
                            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-primary-600 bg-white rounded-full hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-xl shadow-black/10 group"
                        >
                            Send Spontaneous Application
                            <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </a>

                        <div className="border-t border-white/20 pt-10 mt-12">
                            <p className="font-semibold text-white/90 mb-6 text-sm uppercase tracking-widest">Departments We Typically Hire For</p>
                            <div className="flex flex-wrap gap-3 justify-center">
                                {['Engineering', 'Product', 'Marketing', 'Customer Success', 'Operations'].map(dept => (
                                    <span 
                                        key={dept} 
                                        className="px-5 py-2.5 bg-white/10 backdrop-blur-md text-white rounded-full text-sm font-medium border border-white/20 hover:bg-white/20 transition-colors cursor-default"
                                    >
                                        {dept}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
