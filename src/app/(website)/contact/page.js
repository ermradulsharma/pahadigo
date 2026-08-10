'use client';

import { useState } from 'react';
import { useToast } from '@/app/components/ui/ToastContext.js';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        subject: 'General Inquiry',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const name = `${formData.firstName} ${formData.lastName}`.trim();

        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email: formData.email,
                    subject: formData.subject,
                    message: formData.message
                })
            });

            if (res.ok) {
                toast('Your message has been sent successfully!', 'success');
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    subject: 'General Inquiry',
                    message: ''
                });
            } else {
                toast('Failed to send message. Please try again.', 'error');
            }
        } catch (error) {
            toast('An error occurred. Please try again later.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans selection:bg-primary-500 selection:text-white">
            {/* Custom Animated Hero - Light Mode (Consistent with Careers) */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop" 
                        alt="Himalayan Mountains" 
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-gray-50"></div>
                </div>
                
                {/* Animated Gradient Orbs */}
                <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-[800px] h-[800px] bg-primary-100 rounded-full blur-[100px] opacity-60 animate-pulse pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-[600px] h-[600px] bg-secondary-500/20 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-600 font-medium text-sm tracking-wide">
                        Reach Out To Us
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                        Let's Start a <br className="hidden md:block" />
                        <span className="text-gradient">Conversation</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Whether you're a traveler looking for advice or a vendor looking to partner, our team is always here to help you navigate your journey.
                    </p>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative z-10 -mt-10 lg:-mt-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    
                    {/* Left: Contact Information */}
                    <div className="lg:col-span-5 space-y-6 pt-4 lg:pt-10">
                        {/* Phone Card */}
                        <div className="group flex items-start p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-1">
                            <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Call Us</p>
                                <p className="text-xl font-medium text-gray-900 mt-1">+91 (800) 123-4567</p>
                                <p className="text-sm text-gray-500 mt-1">Mon-Fri, 9am to 6pm IST</p>
                            </div>
                        </div>
                        
                        {/* Email Card */}
                        <div className="group flex items-start p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-secondary-200 hover:shadow-xl hover:shadow-secondary-500/10 transition-all duration-300 hover:-translate-y-1">
                            <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-secondary-50 text-secondary-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Email Us</p>
                                <p className="text-xl font-medium text-gray-900 mt-1">support@pahadigo.co.in</p>
                                <p className="text-sm text-gray-500 mt-1">We aim to reply within 24 hours</p>
                            </div>
                        </div>

                        {/* Office Card */}
                        <div className="group flex items-start p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
                            <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <div className="ml-5">
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Visit Us</p>
                                <p className="text-lg font-medium text-gray-900 mt-1">123 Mountain View Road<br/>Dehradun, UK 248001</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-200 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                            {/* Inner Form Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-100/50 rounded-full blur-[80px] pointer-events-none"></div>

                            <h3 className="text-3xl font-bold text-gray-900 mb-8 relative z-10">Send us a Message</h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                                        <input 
                                            type="text" 
                                            id="firstName" 
                                            name="firstName"
                                            required
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-400 transition-all outline-none disabled:opacity-50" 
                                            placeholder="Jane" 
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                                        <input 
                                            type="text" 
                                            id="lastName" 
                                            name="lastName"
                                            required
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-400 transition-all outline-none disabled:opacity-50" 
                                            placeholder="Doe" 
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-400 transition-all outline-none disabled:opacity-50" 
                                        placeholder="jane@example.com" 
                                    />
                                </div>
                                
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                                    <div className="relative">
                                        <select 
                                            id="subject" 
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 appearance-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-400 transition-all outline-none disabled:opacity-50"
                                        >
                                            <option value="General Inquiry">General Inquiry</option>
                                            <option value="Booking Support">Booking Support</option>
                                            <option value="Become a Partner">Become a Partner</option>
                                            <option value="Feedback">Feedback</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                                    <textarea 
                                        id="message" 
                                        name="message"
                                        required
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleChange}
                                        disabled={isSubmitting}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-400 transition-all outline-none resize-none disabled:opacity-50" 
                                        placeholder="How can we help you?"
                                    ></textarea>
                                </div>
                                
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold py-4 px-8 rounded-2xl hover:shadow-lg hover:shadow-primary-500/30 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 group mt-4"
                                >
                                    {isSubmitting ? (
                                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <>
                                            Send Message
                                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
