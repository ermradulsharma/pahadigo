"use client";
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const getCategoryImage = (slug) => {
    const images = {
        'homestay': '/img/category/homestay.png',
        'hotel': '/img/category/hotel.png',
        'camping': '/img/category/camping.png',
        'bungee-jumping': '/img/category/bungee-jumping.png',
        'trekking': '/img/category/trekking.png',
        'rafting': '/img/category/rafting.png',
        'chardham-tour': '/img/category/chardham-yatra.png',
        'bike-scooter-rental': '/img/category/vehicle-rental.png',
        'custom-trip': '/img/category/custom-trip.png',
        'skiing': '/img/category/skiing.png',
        'paragliding': '/img/category/paragliding.png',
    };
    return images[slug] || '/img/category/trekking.png';
};

export default function Categories({ categories }) {
    return (
        <section className="py-24 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black mb-6 text-gray-900">Choose Your Adventure</h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-xl">Discover breathtaking landscapes and thrilling escapades selected for top-tier quality and safety.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories && categories.length > 0 ? categories.map((cat, idx) => (
                    <motion.div key={cat._id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.5, delay: idx * 0.1 }}>
                        <Link href={`/packages?category=${cat.slug}`} className="group relative h-[420px] rounded-2xl overflow-hidden cursor-pointer block shadow-sm hover:shadow-xl transition-shadow duration-500" >
                            <div className="absolute inset-0 bg-gray-900">
                                <Image src={getCategoryImage(cat.slug)} alt={cat.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100" priority={idx < 4} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent transition-opacity duration-500" />
                            </div>

                            <div className="absolute inset-0 p-4 flex flex-col justify-end items-center text-white z-10">
                                <div className="flex justify-between items-center gap-2 transform transition-transform duration-500 group-hover:-translate-y-2">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-bold mb-2 tracking-wide text-center">{cat.name}</h3>
                                        <p className="text-gray-300 line-clamp-2 text-sm opacity-90 font-medium">
                                            {cat.description || `Explore the best ${cat.name} experiences tailored for you.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )) : (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-[400px] bg-gray-100 rounded-2xl flex items-center justify-center animate-pulse border border-gray-200 shadow-sm"></div>
                    ))
                )}
            </div>
        </section>
    );
}
