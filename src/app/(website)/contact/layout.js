export const metadata = {
    title: 'Contact Us - Customer Support & Inquiries',
    description: 'Get in touch with PahadiGo support team for booking assistance, custom Himachal tour itineraries, cab inquiries, or vendor partnership opportunities.',
    keywords: [
        'Contact PahadiGo',
        'PahadiGo Support',
        'Himachal Cab Inquiry',
        'PahadiGo Partner Registration'
    ],
    openGraph: {
        title: 'Contact Us | PahadiGo Customer Support',
        description: 'Need help planning your Himalayan trip? Contact PahadiGo team today.',
        url: 'https://pahadigo.co.in/contact',
        siteName: 'PahadiGo',
        type: 'website',
    },
    alternates: {
        canonical: '/contact',
    }
};

export default function ContactLayout({ children }) {
    return <>{children}</>;
}
