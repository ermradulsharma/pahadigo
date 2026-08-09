import Link from 'next/link';
import connectDB from '@/core/Config/db.js';
import Policy from '@/core/Models/Policy.js';
import { sanitizeHTML } from '@/core/Helpers/security.js';
import { Shield, Eye, Database, Lock, Mail, ChevronRight } from 'lucide-react';

export const metadata = {
    title: 'Privacy Policy | PahadiGo',
    description: 'Learn how PahadiGo collects, uses, and protects your personal information.',
};

export default async function PrivacyPolicy() {
    let policy = null;
    try {
        await connectDB();
        policy = await Policy.findOne({ target: 'admin', type: 'privacy_policy' });
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
                        <Shield className="w-4 h-4 text-primary-400 mr-2" />
                        <span className="text-sm font-medium text-white tracking-wide uppercase">Legal Documentation</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 font-display">
                        Privacy Policy
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
                                <a href="#information-we-collect" className="flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium text-sm">
                                    1. Information We Collect
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500" />
                                </a>
                                <a href="#how-we-use-information" className="flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium text-sm">
                                    2. How We Use Information
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500" />
                                </a>
                                <a href="#sharing-of-information" className="flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium text-sm">
                                    3. Sharing of Information
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500" />
                                </a>
                                <a href="#data-security" className="flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium text-sm">
                                    4. Data Security
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-primary-500" />
                                </a>
                                <a href="#contact-us" className="flex items-center justify-between p-3 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all group font-medium text-sm">
                                    5. Contact Us
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
                                            At PahadiGo, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our platform to book travel experiences in the Himalayas.
                                        </p>
                                    </section>

                                    <section id="information-we-collect" className="mb-14 scroll-mt-32">
                                        <h2 className="text-3xl flex items-center mb-6 text-gray-900">
                                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                                                <Eye className="w-5 h-5 text-gray-700" />
                                            </div>
                                            1. Information We Collect
                                        </h2>
                                        <p>We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
                                        
                                        <h3 className="text-xl text-gray-800 mt-8">Personal Data</h3>
                                        <p>Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site.</p>
                                        
                                        <h3 className="text-xl text-gray-800 mt-8">Financial Data</h3>
                                        <p>Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Site. We store only very limited, if any, financial information that we collect. Otherwise, all financial information is stored by our payment processor, Razorpay.</p>
                                    </section>

                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-12"></div>

                                    <section id="how-we-use-information" className="mb-14 scroll-mt-32">
                                        <h2 className="text-3xl flex items-center mb-6 text-gray-900">
                                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                                                <Database className="w-5 h-5 text-gray-700" />
                                            </div>
                                            2. How We Use Information
                                        </h2>
                                        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
                                        <div className="grid sm:grid-cols-2 gap-4 mt-8 not-prose">
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-colors hover:border-gray-300">
                                                <span className="font-bold text-gray-900 block mb-1">Account Management</span>
                                                <span className="text-sm text-gray-600 block">Create and manage your account securely.</span>
                                            </div>
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-colors hover:border-gray-300">
                                                <span className="font-bold text-gray-900 block mb-1">Transactions</span>
                                                <span className="text-sm text-gray-600 block">Process your transactions and send confirmations.</span>
                                            </div>
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-colors hover:border-gray-300">
                                                <span className="font-bold text-gray-900 block mb-1">Support</span>
                                                <span className="text-sm text-gray-600 block">Resolve disputes and troubleshoot problems.</span>
                                            </div>
                                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-colors hover:border-gray-300">
                                                <span className="font-bold text-gray-900 block mb-1">Marketing</span>
                                                <span className="text-sm text-gray-600 block">Send you a newsletter or marketing communications.</span>
                                            </div>
                                        </div>
                                    </section>

                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-12"></div>

                                    <section id="sharing-of-information" className="mb-14 scroll-mt-32">
                                        <h2 className="text-3xl flex items-center mb-6 text-gray-900">
                                            3. Sharing of Information
                                        </h2>
                                        <p>We may share information we have collected about you in certain situations. Your information may be disclosed as follows:</p>
                                        <ul className="list-none pl-0 space-y-4">
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2.5 mr-4 shrink-0"></div>
                                                <span><strong>With Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf.</span>
                                            </li>
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2.5 mr-4 shrink-0"></div>
                                                <span><strong>With Vendors:</strong> When you book an experience, we share necessary information with the local vendors, guides, or homestay owners to fulfill your reservation.</span>
                                            </li>
                                            <li className="flex items-start">
                                                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2.5 mr-4 shrink-0"></div>
                                                <span><strong>By Law:</strong> If we believe the release of information about you is necessary to respond to legal process, or to protect the rights, property, and safety of others.</span>
                                            </li>
                                        </ul>
                                    </section>

                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-12"></div>

                                    <section id="data-security" className="mb-14 scroll-mt-32">
                                        <h2 className="text-3xl flex items-center mb-6 text-gray-900">
                                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                                                <Lock className="w-5 h-5 text-gray-700" />
                                            </div>
                                            4. Data Security
                                        </h2>
                                        <p>We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.</p>
                                    </section>

                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent my-12"></div>

                                    <section id="contact-us" className="mb-8 scroll-mt-32">
                                        <h2 className="text-3xl flex items-center mb-6 text-gray-900">
                                            <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mr-4 shadow-sm shrink-0">
                                                <Mail className="w-5 h-5 text-gray-700" />
                                            </div>
                                            5. Contact Us
                                        </h2>
                                        <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
                                        <div className="bg-gray-900 text-white rounded-3xl p-8 mt-8 not-prose relative overflow-hidden shadow-2xl shadow-gray-900/20">
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-bl-[4rem]"></div>
                                            <h4 className="font-bold text-xl mb-2 text-white">PahadiGo Support</h4>
                                            <p className="text-gray-400 mb-6 max-w-sm">123 Himalayan Way, Dehradun, Uttarakhand, India</p>
                                            <a href="mailto:support@pahadigo.co.in" className="inline-flex items-center px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                                                support@pahadigo.co.in
                                            </a>
                                        </div>
                                    </section>
                                </>
                            )}

                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
