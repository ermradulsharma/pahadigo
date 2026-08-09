'use client';
import PageHero from '@/components/PageHero.js';
import { useState } from 'react';
import { HelpCircle, ShieldCheck, Map, CreditCard, ChevronDown, MessageCircle } from 'lucide-react';

const faqCategories = [
    {
        id: 'booking',
        title: 'Booking & Reservations',
        icon: Map,
        faqs: [
            {
                question: "How do I book a package?",
                answer: "You can browse our curated packages under the 'Discover' section. Once you find a package you like, click 'Enquire Availability' to get in touch with the verified local vendor directly. They will confirm your dates and facilitate the booking."
            },
            {
                question: "Do you offer custom itineraries?",
                answer: "Absolutely! Many of our local experts are happy to customize an itinerary for your group. Just mention your specific requirements when enquiring about a package."
            },
            {
                question: "Can I modify my booking after it's confirmed?",
                answer: "Modifications to bookings are subject to vendor availability and their specific policies. Please reach out directly to the vendor via our messaging platform to request any changes to your itinerary or dates."
            },
            {
                question: "Do I need to create an account to book?",
                answer: "While you can browse packages as a guest, creating a PahadiGo account is required to send enquiries, communicate with vendors, and manage your bookings securely."
            }
        ]
    },
    {
        id: 'safety',
        title: 'Trust & Safety',
        icon: ShieldCheck,
        faqs: [
            {
                question: "Are the vendors vetted for safety?",
                answer: "Yes, trust and safety are our core values. We personally verify every vendor, homestay owner, and adventure guide on our platform to ensure they meet our strict quality and safety standards before they can list their packages."
            },
            {
                question: "What happens if a vendor cancels my booking?",
                answer: "In the rare event that a vendor has to cancel a confirmed booking due to unforeseen circumstances, we will assist you in finding an alternative experience or ensure you receive a full refund according to our safety guarantee."
            },
            {
                question: "Are reviews authentic?",
                answer: "All reviews on PahadiGo are from verified users who have completed their bookings. We do not allow anonymous reviews to maintain the highest level of authenticity and transparency."
            },
            {
                question: "Who do I contact in case of an emergency during my trip?",
                answer: "Your primary point of contact is your local vendor/guide. However, PahadiGo also provides a 24/7 support line for critical emergencies to ensure you are never stranded."
            }
        ]
    },
    {
        id: 'policies',
        title: 'Payments & Policies',
        icon: CreditCard,
        faqs: [
            {
                question: "What is your cancellation policy?",
                answer: "Cancellation policies vary depending on the specific vendor and the type of package (e.g., trekking vs. homestay). When you contact the vendor, they will provide you with their specific cancellation and refund terms before you make a payment."
            },
            {
                question: "What payment methods are supported?",
                answer: "We support a wide range of secure payment methods through our Razorpay integration, including UPI, Credit/Debit cards, Net Banking, and popular mobile wallets."
            },
            {
                question: "Are there any hidden fees?",
                answer: "No, PahadiGo believes in complete transparency. The price you see includes base fare, GST, and service taxes. Any extra charges (like permits or camera fees) will be explicitly mentioned by the vendor."
            },
            {
                question: "When do I need to pay for my booking?",
                answer: "Payment terms depend on the vendor. Some require full payment upfront, while others may ask for a partial advance to secure the booking, with the rest payable on arrival."
            }
        ]
    },
    {
        id: 'vendor',
        title: 'For Partners',
        icon: HelpCircle,
        faqs: [
            {
                question: "How do I become a vendor on PahadiGo?",
                answer: "If you are a local guide, homestay owner, or transport provider in the Himalayas, we'd love to partner with you. Please visit our 'Partner with Us' page and fill out the application form. Our team will get back to you for verification."
            },
            {
                question: "Is there a registration fee for vendors?",
                answer: "Creating a vendor profile and listing your initial packages is absolutely free. We only charge a small platform commission on successful bookings generated through PahadiGo."
            },
            {
                question: "How do I get paid?",
                answer: "Vendor payouts are processed automatically to your registered bank account after deducting the platform fee. Payout cycles typically run on a weekly basis."
            },
            {
                question: "Can I pause my listings during the off-season?",
                answer: "Yes, our vendor dashboard allows you to easily toggle the availability of your packages or mark your entire business as temporarily closed during the off-season."
            }
        ]
    }
];

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState('booking');
    const [openIndex, setOpenIndex] = useState(0);

    const activeFaqs = faqCategories.find(c => c.id === activeCategory)?.faqs || [];

    return (
        <div className="bg-gray-50/50 min-h-screen pb-24 font-sans selection:bg-primary-500 selection:text-white">
            <PageHero 
                image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop" 
                badge="Help Center" 
                title={<>Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-500">Questions</span></>} 
                subtitle="Everything you need to know about booking your Himalayan adventure with us." 
                heightClass="h-[45vh] min-h-[400px]" 
            />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-white p-6 md:p-12">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Sidebar Categories */}
                        <div className="lg:col-span-4 space-y-3">
                            <h2 className="text-xl font-black text-gray-900 mb-6 px-2 font-display tracking-tight">Topics</h2>
                            {faqCategories.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = activeCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => {
                                            setActiveCategory(cat.id);
                                            setOpenIndex(0);
                                        }}
                                        className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 text-left group ${
                                            isActive 
                                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30 translate-x-2' 
                                            : 'bg-transparent text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl mr-4 transition-colors ${
                                            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-sm'
                                        }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold">{cat.title}</span>
                                    </button>
                                );
                            })}
                            
                            {/* Support Card */}
                            <div className="mt-8 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100/50 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full transition-transform group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
                                        <MessageCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Still need help?</h3>
                                    <p className="text-sm text-gray-600 mb-5 leading-relaxed">Our support team is always ready to assist you with any queries.</p>
                                    <a href="/contact" className="inline-flex items-center justify-center w-full px-5 py-3 text-sm font-bold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-900/20">
                                        Contact Support
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* FAQs Accordion */}
                        <div className="lg:col-span-8">
                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-gray-900 font-display tracking-tight mb-2">
                                    {faqCategories.find(c => c.id === activeCategory)?.title}
                                </h2>
                                <p className="text-gray-500">Find answers to common questions about {faqCategories.find(c => c.id === activeCategory)?.title.toLowerCase()}.</p>
                            </div>

                            <div className="space-y-4">
                                {activeFaqs.map((faq, index) => (
                                    <div 
                                        key={index} 
                                        className={`group rounded-2xl overflow-hidden transition-all duration-500 border-2 ${
                                            openIndex === index 
                                            ? 'border-primary-100 bg-primary-50/30' 
                                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                                        }`}
                                    >
                                        <button 
                                            className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                                            onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                                        >
                                            <span className={`font-bold text-lg pr-8 transition-colors ${
                                                openIndex === index ? 'text-primary-700' : 'text-gray-800 group-hover:text-primary-600'
                                            }`}>
                                                {faq.question}
                                            </span>
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                                openIndex === index 
                                                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 rotate-180' 
                                                : 'bg-white text-gray-400 border border-gray-200'
                                            }`}>
                                                <ChevronDown className="w-5 h-5" />
                                            </div>
                                        </button>
                                        
                                        <div 
                                            className={`grid transition-all duration-500 ease-in-out ${
                                                openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                        >
                                            <div className="overflow-hidden">
                                                <div className="px-6 pb-6 text-gray-600 leading-relaxed text-base pt-2">
                                                    {faq.answer}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
