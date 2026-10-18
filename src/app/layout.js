import './globals.css';
import Script from 'next/script';
import { ToastProvider } from '@/components/ui/ToastContext.js';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-sans',
    display: 'swap',
});

const outfit = Outfit({
    subsets: ['latin'],
    variable: '--font-display',
    display: 'swap',
});

export const metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://pahadigo.co.in'),
    title: {
        template: '%s | PahadiGo',
        default: 'PahadiGo - Book Himachal Tour Packages, Cabs & Homestays',
    },
    description: 'Discover and book verified homestays, cab rentals for Spiti & Manali, trekking, camping, and adventure activities across Himachal Pradesh.',
    keywords: [
        'PahadiGo',
        'Himachal Tour Packages',
        'Manali Tour Packages',
        'Spiti Valley Trip',
        'Kasol Homestays',
        'Himachal Cab Rental',
        'Trekking in Himachal'
    ],
    // [SECURITY] Infrastructure Hardening Headers
    other: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com https://www.google-analytics.com https://analytics.google.com; connect-src 'self' https://api.razorpay.com https://www.google-analytics.com https://analytics.google.com; font-src 'self' https://fonts.gstatic.com;",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" className={`${plusJakartaSans.variable} ${outfit.variable}`}>
            <body className="antialiased font-sans">
                <ToastProvider>
                    {children}
                </ToastProvider>
                {/* Google tag (gtag.js) */}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-1L0FGXLXS3"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());

                      gtag('config', 'G-1L0FGXLXS3');
                    `}
                </Script>
            </body>
        </html>
    );
}

