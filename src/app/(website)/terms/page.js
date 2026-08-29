import Link from 'next/link';
import connectDB from '@/core/Config/db.js';
import Policy from '@/core/Models/Policy.js';
import { sanitizeHTML } from '@/core/Helpers/security.js';
import { Shield, ChevronRight, FileText, CreditCard, AlertTriangle, Scale } from 'lucide-react';

export const metadata = {
    title: 'Terms of Service - Booking Terms & Conditions',
    description: 'Read PahadiGo terms of service, vendor booking agreements, cancellation terms, and user guidelines for Himalayan travel services.',
    keywords: [
        'PahadiGo Terms of Service',
        'PahadiGo Terms and Conditions',
        'Himachal Travel Booking Terms'
    ],
    openGraph: {
        title: 'Terms of Service | PahadiGo',
        description: 'Read PahadiGo terms of service and booking guidelines.',
        url: 'https://pahadigo.co.in/terms',
        siteName: 'PahadiGo',
        type: 'website',
    },
    alternates: {
        canonical: '/terms',
    }
};

export default async function TermsOfService() {
    let policy = null;
    try {
        await connectDB();
        policy = await Policy.findOne({ target: 'admin', type: 'terms_conditions' });
    } catch (error) {
    }

    const lastUpdated = policy?.updatedAt ? new Date(policy.updatedAt).toLocaleDateString() : new Date().toLocaleDateString();

    return (
        <div className="bg-[#fcfcfc] min-h-screen pb-24 font-sans text-gray-800 selection:bg-primary-500 selection:text-white">
            
            {/* Premium Header */}
            <header className="relative bg-gray-900 overflow-hidden pt-32 pb-20">
                <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" alt="Background" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-sm">
                        <FileText className="w-4 h-4 text-primary-400 mr-2" />
                        <span className="text-sm font-medium text-white tracking-wide uppercase">Legal Documentation</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 font-display">
                        Terms of Service
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 font-medium">
                        Effective Date: <span className="text-white">{lastUpdated}</span>
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    
                    {/* Premium Sidebar Navigation */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-28 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-3xl p-6 shadow-xl shadow-gray-200/20">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Contents</h3>
                            <nav className="space-y-1">
                                <a href="#introduction" className="flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium text-sm">
                                    Introduction
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500" />
                                </a>
                                <a href="#use-of-services" className="flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium text-sm">
                                    1. Use of Services
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500" />
                                </a>
                                <a href="#bookings-payments" className="flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium text-sm">
                                    2. Bookings & Payments
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500" />
                                </a>
                                <a href="#liability" className="flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium text-sm">
                                    3. Limitation of Liability
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500" />
                                </a>
                            </nav>
                        </div>
                    </div>

                    {/* Premium Main Content */}
                    <div className="lg:col-span-9">
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 md:p-14 shadow-2xl shadow-gray-200/30 prose prose-lg prose-gray max-w-none prose-headings:font-display prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary-600 prose-p:leading-relaxed prose-p:text-gray-600">
                            
                            {policy?.content ? (
                                <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(policy.content) }} />
                            ) : (
                                <>
                                    <section id="introduction" className="mb-14 scroll-mt-32">
                                        <p className="lead text-xl text-gray-800 font-medium border-l-4 border-primary-500 pl-6 m-0">
                                            Welcome to PahadiGo. By accessing or using our website, platform, and services, you agree to be bound by these Terms of Service. Please read them carefully before making any bookings.
                                        </p>
                                    </section>

                                    <section id="use-of-services" className="mb-14 scroll-mt-32">
                                        <h2 className="text-3xl flex items-center mb-6 text-gray-900">
                                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                                                <Shield className="w-5 h-5 text-gray-700" />
                                            </div>
                                            1. Use of Our Services
                                        </h2>
                                        <p>You may use our services only for lawful purposes and in accordance with these Terms. You agree not to use our services in any way that violates any applicable local, state, national, or international law.</p>
                                        <ul className="list-none pl-0 space-y-4 mt-6">
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2.5 mr-4 shrink-0"></div>
                                                <span>You must provide accurate and complete information when creating an account.</span>
                                            </li>
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2.5 mr-4 shrink-0"></div>
                                                <span>You are responsible for maintaining the confidentiality of your account credentials.</span>
                                            </li>
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2.5 mr-4 shrink-0"></div>
                                                <span>We reserve the right to suspend or terminate accounts that violate these terms.</span>
                                            </li>
                                        </ul>
                                    </section>

                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-12"></div>

                                    <section id="bookings-payments" className="mb-14 scroll-mt-32">
                                        <h2 className="text-3xl flex items-center mb-6 text-gray-900">
                                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                                                <CreditCard className="w-5 h-5 text-gray-700" />
                                            </div>
                                            2. Bookings and Payments
                                        </h2>
                                        <p>All bookings made through PahadiGo are subject to availability and acceptance by the respective vendor. We act as an intermediary and platform provider.</p>
                                        <div className="grid sm:grid-cols-2 gap-4 mt-8 not-prose">
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-colors hover:border-gray-300">
                                                <span className="font-bold text-gray-900 block mb-1">Vendor Responsibility</span>
                                                <span className="text-sm text-gray-600 block">We are not responsible for the acts or omissions of vendors providing the actual service.</span>
                                            </div>
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-colors hover:border-gray-300">
                                                <span className="font-bold text-gray-900 block mb-1">Vendor Terms</span>
                                                <span className="text-sm text-gray-600 block">You agree to the vendor's specific terms regarding cancellations and refunds.</span>
                                            </div>
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-colors hover:border-gray-300">
                                                <span className="font-bold text-gray-900 block mb-1">Payment Processing</span>
                                                <span className="text-sm text-gray-600 block">Payments are processed securely via third-party gateways (e.g. Razorpay).</span>
                                            </div>
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-colors hover:border-gray-300">
                                                <span className="font-bold text-gray-900 block mb-1">Pricing Accuracy</span>
                                                <span className="text-sm text-gray-600 block">We strive for accurate pricing, but errors may occur and we reserve the right to correct them.</span>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-12"></div>

                                    <section id="liability" className="mb-14 scroll-mt-32">
                                        <h2 className="text-3xl flex items-center mb-6 text-gray-900">
                                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                                                <Scale className="w-5 h-5 text-gray-700" />
                                            </div>
                                            3. Limitation of Liability
                                        </h2>
                                        <p>To the fullest extent permitted by applicable law, PahadiGo and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from:</p>
                                        <ul className="list-disc pl-5 mt-4 space-y-2">
                                            <li>Your access to or use of or inability to access or use the services;</li>
                                            <li>Any conduct or content of any third party on the services;</li>
                                            <li>Any content obtained from the services; or</li>
                                            <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                                        </ul>
                                    </section>

                                    <div className="bg-gray-900 text-white rounded-3xl p-8 mt-12 not-prose relative overflow-hidden shadow-2xl shadow-gray-900/20">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-[4rem]"></div>
                                        <div className="flex items-start">
                                            <div className="bg-white/10 p-3 rounded-xl mr-5 backdrop-blur-md shrink-0">
                                                <AlertTriangle className="w-6 h-6 text-primary-400" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xl mb-2 text-white">Important Notice</h4>
                                                <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                                                    {policy?.content ? 'These terms are managed by administration and subject to change.' : 'These terms are subject to change without prior notice. We will notify you of any significant changes by updating the date at the top of this policy.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
