import Image from 'next/image';

export default function PageHero({
    image,
    title,
    subtitle,
    badge,
    children,
    heightClass = "h-[60vh] min-h-[500px]"
}) {
    return (
        <section className={`relative ${heightClass} flex items-center justify-center overflow-hidden`}>
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image src={image} alt={typeof title === 'string' ? title : "Hero Background"} fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-gray-50"></div>
            </div>

            <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-16">
                {badge && (
                    <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 text-sm font-bold tracking-wide mb-6 animate-fade-in-up">
                        {badge}
                    </span>
                )}

                <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 drop-shadow-lg leading-tight font-display">
                    {title}
                </h1>

                {subtitle && (
                    <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        {subtitle}
                    </p>
                )}

                {children}
            </div>
        </section>
    );
}
