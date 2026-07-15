import PageHero from '@/components/PageHero.js';

export const metadata = {
    title: 'Contact Us | PahadiGo',
    description: 'Get in touch with PahadiGo. We are here to help you plan your next Himalayan adventure.'
};

export default function ContactPage() {
    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <PageHero 
                image="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop" 
                badge="Reach Out" 
                title={<>Contact <span className="text-gradient">Us</span></>} 
                subtitle="Have a question or need help with a booking? Our team is here for you." 
                heightClass="h-[40vh] min-h-[300px]" 
            />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Contact Information */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
                            <p className="text-gray-600 mb-8">
                                Whether you're a traveler looking for advice or a vendor looking to partner, we'd love to hear from you.
                            </p>
                            
                            <div className="space-y-6">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100">
                                        <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Phone</p>
                                        <p className="text-gray-600 mt-1">+91 (800) 123-4567</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Mon-Fri from 9am to 6pm IST</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100">
                                        <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Email</p>
                                        <p className="text-gray-600 mt-1">support@pahadigo.co.in</p>
                                        <p className="text-xs text-gray-500 mt-0.5">We aim to reply within 24 hours</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100">
                                        <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Office</p>
                                        <p className="text-gray-600 mt-1">123 Mountain View Road<br/>Dehradun, Uttarakhand 248001</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Send us a Message</h3>
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="first-name" className="block text-sm font-semibold text-gray-700 mb-1.5">First Name</label>
                                        <input type="text" id="first-name" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none" placeholder="Jane" />
                                    </div>
                                    <div>
                                        <label htmlFor="last-name" className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name</label>
                                        <input type="text" id="last-name" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none" placeholder="Doe" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                                    <input type="email" id="email" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none" placeholder="jane@example.com" />
                                </div>
                                
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                                    <select id="subject" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none bg-white">
                                        <option>General Inquiry</option>
                                        <option>Booking Support</option>
                                        <option>Become a Partner</option>
                                        <option>Feedback</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                                    <textarea id="message" rows="5" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors outline-none resize-none" placeholder="How can we help you?"></textarea>
                                </div>
                                
                                <button type="button" className="w-full bg-primary-600 text-white font-bold py-3.5 px-6 rounded-xl hover:bg-primary-700 transition-colors shadow-sm focus:ring-4 focus:ring-primary-500/20">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
