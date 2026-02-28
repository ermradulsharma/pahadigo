import './globals.css';

export const metadata = {
    title: {
        template: '%s | PahadiGo',
        default: 'PahadiGo - Your Adventure Awaits',
    },
    description: 'Discover and book the best homestays, trekking, camping, and adventure activities.',
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
