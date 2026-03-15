import './globals.css';

export const metadata = {
    title: {
        template: '%s | PahadiGo',
        default: 'PahadiGo - Your Adventure Awaits',
    },
    description: 'Discover and book the best homestays, trekking, camping, and adventure activities.',
    // [SECURITY] Infrastructure Hardening Headers
    other: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https://res.cloudinary.com; connect-src 'self' https://api.razorpay.com; font-src 'self' https://fonts.gstatic.com;",
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
            </body>
        </html>
    );
}
