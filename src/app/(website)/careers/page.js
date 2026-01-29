import Link from 'next/link';
import PageHero from '@/components/PageHero';

export default function Careers() {
    return (
        <div className="bg-gray-50 min-h-screen">
            <PageHero
                image="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070&auto=format&fit=crop"
                badge="Join Our Team"
                title={<>Build the Future of <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">Travel with Us</span></>}
                subtitle="We are bringing the Himalayas closer to the world. Join us in our mission to create authentic and sustainable travel experiences."
                heightClass="h-[60vh] min-h-[500px]"
            />

            <div className="pt-20 pb-20">
                <div className="max-w-4xl mx-auto px-4">

                    <div className="bg-white border border-gray-100 rounded-3xl p-12 shadow-2xl shadow-indigo-100/50 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50"></div>

                        <div className="relative z-10">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 rounded-2xl mb-6 text-indigo-600">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">No Open Positions</h2>
                            <p className="text-gray-600 mb-8 max-w-lg mx-auto leading-relaxed">
                                We currently don&apos;t have any open roles, but we&apos;re always looking for exceptional talent.
                                If you believe you can make a difference, send your resume to <a href="mailto:careers@pahadigo.com" className="text-indigo-600 font-bold hover:underline">careers@pahadigo.com</a>.
                            </p>

                            <div className="border-t border-gray-100 pt-8 mt-8">
                                <p className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Departments</p>
                                <div className="flex flex-wrap gap-3 justify-center">
                                    {['Engineering', 'Product', 'Marketing', 'Customer Success', 'Operations'].map(dept => (
                                        <span key={dept} className="px-4 py-2 bg-gray-50 text-gray-600 rounded-full text-sm font-medium border border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-default">{dept}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
