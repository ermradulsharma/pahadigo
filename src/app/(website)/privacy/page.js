import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 font-display">Privacy Policy</h1>
                        <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>

                        <div className="relative z-10 prose prose-lg prose-indigo max-w-none text-gray-600">
                            <p className="lead text-xl text-gray-700 mb-8">
                                At PahadiGo, we take your privacy seriously. This Privacy Policy explains seamlessly how we collect, use, and protect your personal information when you use our platform.
                            </p>

                            <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-4 text-sm font-bold">1</span>
                                Information We Collect
                            </h3>
                            <p>We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, request customer support, or contact us. This may include:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-4 marker:text-indigo-500">
                                <li>Name and contact information</li>
                                <li>Travel preferences and booking history</li>
                                <li>Payment information (processed securely by third-party providers)</li>
                                <li>Communications with us</li>
                            </ul>

                            <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-4 text-sm font-bold">2</span>
                                How We Use Your Information
                            </h3>
                            <p>We use the information we collect to provide, maintain, and improve our services, including to:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-4 marker:text-indigo-500">
                                <li>Process transactions and send related information</li>
                                <li>Verify your identity and prevent fraud</li>
                                <li>Send you technical notices, updates, and support messages</li>
                                <li>Respond to your comments and questions</li>
                            </ul>

                            <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-4 text-sm font-bold">3</span>
                                Contact Us
                            </h3>
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 not-prose">
                                <p className="text-gray-600 mb-4">If you have any questions about this Privacy Policy, please contact us at:</p>
                                <a href="mailto:support@pahadigo.com" className="text-indigo-600 font-bold hover:underline flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    support@pahadigo.com
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
