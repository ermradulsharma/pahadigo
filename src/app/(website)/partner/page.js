import PageHero from '@/components/PageHero.js';
import Link from 'next/link';

export const metadata = {
    title: 'Partner With Us | PahadiGo',
    description: 'Join PahadiGo as a trusted local vendor and grow your travel or homestay business.'
};

export default function PartnerPage() {
    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <PageHero 
                image="https://images.unsplash.com/photo-1540304473527-774fdbed8e68?q=80&w=2070&auto=format&fit=crop" 
                badge="Grow with Us" 
                title={<>Partner with <span className="text-gradient">PahadiGo</span></>} 
                subtitle="Join our network of trusted local homestays, guides, and adventure operators." 
                heightClass="h-[40vh] min-h-[300px]" 
            />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                
                {/* Benefits Section */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Partner With Us?</h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        We connect passionate local hosts and guides with travelers seeking authentic Himalayan experiences.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Grow Your Business</h3>
                        <p className="text-gray-600">Get discovered by thousands of travelers looking for unique, off-the-beaten-path experiences.</p>
                    </div>
                    
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Trust</h3>
                        <p className="text-gray-600">Being a PahadiGo verified vendor instantly builds trust with travelers regarding safety and quality.</p>
                    </div>

                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
                        <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-purple-600">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Setup Fees</h3>
                        <p className="text-gray-600">Listing your packages and homestays is completely free. We only earn when you earn.</p>
                    </div>
                </div>

                {/* Application Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Apply to Become a Vendor</h3>
                        <p className="text-gray-500">Fill out the form below and our partnership team will contact you within 48 hours.</p>
                    </div>

                    <form className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none" placeholder="e.g. Himalayan Homestays" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
                                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none" placeholder="John Doe" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                                <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                                <input type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none" placeholder="+91 98765 43210" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Business Type</label>
                            <select className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none bg-white">
                                <option>Homestay / Hotel</option>
                                <option>Trekking / Adventure Guide</option>
                                <option>Transport Provider</option>
                                <option>Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Brief Description of Services</label>
                            <textarea rows="4" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none resize-none" placeholder="Tell us about the experiences you offer..."></textarea>
                        </div>

                        <div className="pt-4">
                            <button type="button" className="w-full bg-primary-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-primary-700 transition-colors shadow-sm focus:ring-4 focus:ring-primary-500/20">
                                Submit Application
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
