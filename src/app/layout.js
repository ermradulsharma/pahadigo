import './globals.css';
import Script from 'next/script';

export const metadata = {
    title: {
        template: '%s | PahadiGo',
        default: 'PahadiGo - Your Adventure Awaits',
    },
    description: 'Discover and book the best homestays, trekking, camping, and adventure activities.',
    // [SECURITY] Infrastructure Hardening Headers
    other: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com https://www.google-analytics.com https://analytics.google.com; connect-src 'self' https://api.razorpay.com https://www.google-analytics.com https://analytics.google.com; font-src 'self' https://fonts.gstatic.com;",
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocations=(self)'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased font-sans">
                {children}
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

