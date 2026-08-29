export const metadata = {
    title: 'Frequently Asked Questions (FAQ) | PahadiGo Help Center',
    description: 'Find clear answers about booking tour packages, cab rentals for Spiti & Manali, verified homestays, trust & safety guarantees, and cancellation policies on PahadiGo.',
    keywords: [
        'PahadiGo FAQ',
        'Himachal Tour Package Booking FAQ',
        'Spiti Cab Rental Charges',
        'Kasol Homestay Verification',
        'PahadiGo Cancellation Policy'
    ],
    openGraph: {
        title: 'Frequently Asked Questions (FAQ) | PahadiGo',
        description: 'Get answers to all your questions about Himachal tour packages, cab rentals, homestays, and payments on PahadiGo.',
        url: 'https://pahadigo.co.in/faq',
        siteName: 'PahadiGo',
        type: 'website',
    },
    alternates: {
        canonical: '/faq',
    }
};

export default function FAQLayout({ children }) {
    return <>{children}</>;
}
