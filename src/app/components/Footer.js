import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <span className="text-3xl font-bold font-display text-white block">
                            Pahadi<span className="text-primary-500">Go</span>
                        </span>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            We are on a mission to make Himalayan travel accessible, authentic, and sustainable. Join our community of explorers.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                                <span className="sr-only">Facebook</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                                <span className="sr-only">Instagram</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08v.001zm0 2.163c-2.614 0-2.922.01-3.953.058-.962.045-1.484.234-1.832.37a2.915 2.915 0 00-1.065.693 2.915 2.915 0 00-.693 1.065c-.136.347-.325.869-.37 1.833-.047 1.03-.058 1.338-.058 3.953v.098c0 2.614.01 2.922.058 3.953.045.962.234 1.484.37 1.832.222.571.492.999.932 1.439.44.44.868.71 1.439.932.347.136.869.325 1.833.37 1.03.047 1.338.058 3.953.058h.098c2.614 0 2.922-.01 3.953-.058.962-.045 1.484-.234 1.832-.37a2.915 2.915 0 001.065-.693 2.915 2.915 0 00.693-1.065c.136-.347.325-.869.37-1.833.047-1.03.058-1.338.058-3.953v-.098c0-2.614-.01-2.922-.058-3.953-.045-.962-.234-1.484-.37-1.832a2.915 2.915 0 00-.693-1.065 2.915 2.915 0 00-1.065-.693c-.347-.136-.869-.325-1.833-.37-1.03-.047-1.338-.058-3.953-.058h-.098zm0 5.289a3.297 3.297 0 100 6.594 3.297 3.297 0 000-6.594zm0 2.163a1.134 1.134 0 110 2.268 1.134 1.134 0 010-2.268zm5.79-4.83a1.44 1.44 0 110 2.88 1.44 1.44 0 010-2.88z" clipRule="evenodd" /></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors">
                                <span className="sr-only">Twitter</span>
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-6">Company</h4>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-6">Discover</h4>
                        <ul className="space-y-4 text-gray-400 text-sm">
                            <li><Link href="/packages?category=trekking" className="hover:text-white transition-colors">Trekking Packages</Link></li>
                            <li><Link href="/packages?category=camping" className="hover:text-white transition-colors">Camping Sites</Link></li>
                            <li><Link href="/packages?category=homestay" className="hover:text-white transition-colors">Homestays</Link></li>
                            <li><Link href="#contact" className="hover:text-white transition-colors">Partner with Us</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-lg font-bold mb-6">Newsletter</h4>
                        <p className="text-gray-400 text-sm mb-4">Subscribe to get the latest offers and trekking guides.</p>
                        <div className="flex">
                            <input type="email" placeholder="Your email" className="bg-gray-800 text-white px-4 py-2 rounded-l-lg focus:outline-none w-full border border-gray-700 focus:border-primary-500" />
                            <button className="bg-primary-600 px-4 py-2 rounded-r-lg hover:bg-primary-700 transition-colors">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} PahadiGo Technologies Pvt Ltd. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
