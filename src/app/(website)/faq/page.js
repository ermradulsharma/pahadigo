'use client';
import PageHero from '@/components/PageHero.js';
import { useState } from 'react';

const faqs = [
    {
        question: "How do I book a package?",
        answer: "You can browse our curated packages under the 'Discover' section. Once you find a package you like, click 'Enquire Availability' to get in touch with the verified local vendor directly. They will confirm your dates and facilitate the booking."
    },
    {
        question: "Are the vendors vetted for safety?",
        answer: "Yes, trust and safety are our core values. We personally verify every vendor, homestay owner, and adventure guide on our platform to ensure they meet our strict quality and safety standards before they can list their packages."
    },
    {
        question: "What is your cancellation policy?",
        answer: "Cancellation policies vary depending on the specific vendor and the type of package (e.g., trekking vs. homestay). When you contact the vendor, they will provide you with their specific cancellation and refund terms before you make a payment."
    },
    {
        question: "Do you offer custom itineraries?",
        answer: "Absolutely! Many of our local experts are happy to customize an itinerary for your group. Just mention your specific requirements when enquiring about a package."
    },
    {
        question: "How do I become a vendor on PahadiGo?",
        answer: "If you are a local guide, homestay owner, or transport provider in the Himalayas, we'd love to partner with you. Please visit our 'Partner with Us' page and fill out the application form. Our team will get back to you for verification."
    }
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState(0);

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <PageHero 
                image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" 
                badge="Help Center" 
                title={<>Frequently Asked <span className="text-gradient">Questions</span></>} 
                subtitle="Everything you need to know about booking your Himalayan adventure with us." 
                heightClass="h-[40vh] min-h-[300px]" 
            />
            
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Common Questions</h2>
                    
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div 
                                key={index} 
                                className={`border ${openIndex === index ? 'border-primary-500 bg-primary-50/30' : 'border-gray-200 bg-white'} rounded-xl overflow-hidden transition-all duration-300`}
                            >
                                <button 
                                    className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                                    onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                >
                                    <span className={`font-semibold text-lg ${openIndex === index ? 'text-primary-700' : 'text-gray-900'}`}>
                                        {faq.question}
                                    </span>
                                    <div className={`flex-shrink-0 ml-4 h-8 w-8 rounded-full flex items-center justify-center transition-colors ${openIndex === index ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <svg 
                                            className={`h-5 w-5 transform transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>
                                
                                <div 
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <p className="text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center bg-gray-50 rounded-xl p-8 border border-gray-100">
                        <p className="text-gray-600 mb-4">Still have questions?</p>
                        <a href="/contact" className="inline-flex items-center text-primary-600 font-bold hover:text-primary-700 transition-colors">
                            Contact our support team
                            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
