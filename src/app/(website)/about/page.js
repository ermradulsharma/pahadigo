import ClientAbout from './ClientAbout.js';

export const metadata = {
    title: 'About Us | PahadiGo - Empowering Himalayan Travel & Local Tourism',
    description: 'Learn about PahadiGo, our mission to empower local Himalayan communities, host verified homestays, licensed cab drivers, and authentic trekking experiences across Himachal Pradesh.',
    keywords: [
        'About PahadiGo',
        'Himachal Travel Platform',
        'Himalayan Tourism Marketplace',
        'Er. Mradul Sharma',
        'PahadiGo Mission',
        'Local Himachal Vendors'
    ],
    openGraph: {
        title: 'About Us | PahadiGo - Empowering Himalayan Travel',
        description: 'Empowering local Himalayan hosts, verified cab drivers, and outdoor guides with technology.',
        url: 'https://pahadigo.co.in/about',
        siteName: 'PahadiGo',
        type: 'website',
    },
    alternates: {
        canonical: '/about',
    }
};

export default function AboutPage() {
    return <ClientAbout />;
}
