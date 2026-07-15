"use client";

import Hero from '@/components/frontend/Hero.js';
import Stats from '@/components/frontend/Stats.js';
import Categories from '@/components/frontend/Categories.js';
import Features from '@/components/frontend/Features.js';
import AppDownload from '@/components/frontend/AppDownload.js';

export default function ClientHome({ categories }) {
    return (
        <div className="bg-gray-50 min-h-screen font-sans selection:bg-primary-500 selection:text-white">
            <Hero />
            <Stats />
            <Categories categories={categories} />
            <Features />
            <AppDownload />
        </div>
    );
}
