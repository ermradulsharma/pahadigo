import Link from 'next/link';

export default function TermsOfService() {
    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 font-display">Terms of Service</h1>
                        <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>

                        <div className="relative z-10 prose prose-lg prose-indigo max-w-none text-gray-600">
                            <p className="lead text-xl text-gray-700 mb-8">
                                Welcome to PahadiGo. By accessing or using our website, you agree to be bound by these Terms of Service. Please read them carefully.
                            </p>

                            <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-4 text-sm font-bold">1</span>
                                Use of Our Services
                            </h3>
                            <p>You may use our services only for lawful purposes and in accordance with these Terms. You agree not to use our services in any way that violates any applicable local, state, national, or international law.</p>

                            <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-4 text-sm font-bold">2</span>
                                Bookings and Payments
                            </h3>
                            <p>All bookings made through PahadiGo are subject to availability and acceptance by the respective vendor. We act as an intermediary and are not responsible for the acts or omissions of vendors.</p>
                            <p className="mt-4">When you make a booking, you agree to the vendor&apos;s terms and conditions, specifically regarding cancellations and refunds.</p>

                            <h3 className="text-2xl font-bold text-gray-900 mt-12 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mr-4 text-sm font-bold">3</span>
                                Limitation of Liability
                            </h3>
                            <p>PahadiGo shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of our services.</p>

                            <div className="border-l-4 border-indigo-500 bg-indigo-50 p-6 rounded-r-xl mt-8 not-prose">
                                <p className="font-bold text-indigo-900 mb-1">Note:</p>
                                <p className="text-indigo-800 text-sm">These terms are subject to change. We will notify you of any significant changes by updating the date at the top of this policy.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
