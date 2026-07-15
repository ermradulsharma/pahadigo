'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Search, Compass, HeadphonesIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
    return (
        <div className="bg-white min-h-screen flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-8 py-16 lg:py-24">

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="w-full lg:w-1/2 space-y-8 text-center lg:text-left"
                    >
                        <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-full font-medium text-sm">
                            <Compass className="w-4 h-4" />
                            <span>Error 404</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            Looks like you're <br className="hidden lg:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-500">
                                off the map.
                            </span>
                        </h1>

                        <p className="text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
                            The trail you're looking for has either been moved, deleted, or never existed in the first place. Don't worry, even the best explorers get lost sometimes.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-all hover:shadow-md hover:-translate-y-0.5"
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Return to Basecamp
                            </Link>
                            <Link
                                href="/packages"
                                className="inline-flex items-center justify-center px-8 py-4 border border-gray-200 text-base font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all hover:shadow-sm"
                            >
                                <Search className="w-5 h-5 mr-2 text-gray-500" />
                                Find New Trails
                            </Link>
                        </div>

                        <div className="pt-8 flex items-center justify-center lg:justify-start space-x-2 text-sm text-gray-500">
                            <HeadphonesIcon className="w-4 h-4 text-gray-400" />
                            <span>Need help? <Link href="/contact" className="font-medium text-primary-600 hover:text-primary-700 hover:underline underline-offset-4">Contact Support</Link></span>
                        </div>
                    </motion.div>

                    {/* Illustration */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="w-full lg:w-1/2 flex justify-center lg:justify-end"
                    >
                        <div className="relative w-full max-w-lg aspect-square">
                            <div className="absolute inset-0 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
                            <Image
                                src="/img/404-illustration.png"
                                alt="Lost Hiker Illustration"
                                fill
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-contain relative z-10 drop-shadow-xl"
                                priority
                            />
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
