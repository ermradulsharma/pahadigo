'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Calendar, Users, Send, ShieldCheck } from 'lucide-react';

export default function PackageBookingForm({ service, price }) {
    const [formData, setFormData] = useState({ name: '', phone: '', date: '', adults: 1, children: 0 });
    const [totalPrice, setTotalPrice] = useState(price);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { setTotalPrice((parseInt(formData.adults) || 0) * price); }, [formData.adults, formData.children, price]);
    const handleChange = (e) => { const { name, value } = e.target; setFormData((prev) => ({ ...prev, [name]: value })); };
    const handleWhatsAppBooking = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.name || !formData.phone || !formData.date) {
            setIsSubmitting(false);
            return;
        }

        const title = service.title || service.roomType || service.campingType || service.trekkingName || service.tourName || 'Package';
        const category = service.serviceType || service.category || 'Package';
        const message = `*PahadiGo Booking Inquiry*\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `*Package:* ${title}\n` +
            `*Category:* ${category}\n` +
            `*Total Est. Price:* ₹${totalPrice}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `*Traveller Details:*\n` +
            `👤 *Name:* ${formData.name}\n` +
            `📱 *Phone:* ${formData.phone}\n` +
            `📅 *Date:* ${formData.date}\n` +
            `👥 *Guests:* ${formData.adults} Adults, ${formData.children} Children\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `_Inquiry sent securely via PahadiGo.com_`;

        const encodedText = encodeURIComponent(message);
        const waUrl = `https://wa.me/919536489063?text=${encodedText}`;

        // Simulate a brief loading state for UX
        setTimeout(() => {
            window.open(waUrl, "_blank", "noopener,noreferrer");
            setIsSubmitting(false);
        }, 600);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="sticky top-24 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 overflow-hidden">
            {/* Header Section */}
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-b border-gray-100 flex flex-col items-center justify-center text-center">
                <span className="bg-primary-100 text-primary-700 text-[10px] font-extrabold uppercase tracking-[0.2em] py-1 px-3 rounded-full mb-3">Special Online Pricing</span>
                <div className="flex items-baseline space-x-1"><span className="text-4xl font-extrabold text-gray-900 tracking-tight">₹{price}</span><span className="text-gray-500 font-medium">/person</span></div>
                {totalPrice > price && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 text-sm font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">Total Estimate: ₹{totalPrice}</motion.div>
                )}
            </div>

            <div className="p-6 sm:p-8">
                {service.vendor && (
                    <div className="flex items-center space-x-4 pb-6 mb-6 border-b border-gray-100">
                        <div className="w-12 h-12 bg-gradient-to-tr from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-600 border border-gray-200 shadow-sm">{service.vendor.businessName?.[0]}</div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Verified Partner</p>
                            <p className="font-bold text-gray-900 text-sm">{service.vendor.businessName}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleWhatsAppBooking} className="space-y-5">
                    {/* Name Field */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User className="h-4 w-4 text-gray-400" /></div>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] focus:bg-white outline-none transition-all text-gray-900 placeholder-gray-400" />
                        </div>
                    </div>

                    {/* Phone Field */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">WhatsApp Number</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Phone className="h-4 w-4 text-gray-400" /></div>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91 98765 43210" className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] focus:bg-white outline-none transition-all text-gray-900 placeholder-gray-400" />
                        </div>
                    </div>

                    {/* Date Field */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Travel Date</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-gray-400" /></div>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} min={new Date().toISOString().split("T")[0]} required className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] focus:bg-white outline-none transition-all text-gray-900" />
                        </div>
                    </div>

                    {/* Guests Field */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Adults</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Users className="h-4 w-4 text-gray-400" /></div>
                                <input type="number" name="adults" value={formData.adults} onChange={handleChange} min="1" required className="w-full pl-9 pr-3 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] focus:bg-white outline-none transition-all text-gray-900" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Children</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Users className="h-3.5 w-3.5 text-gray-400" /></div>
                                <input type="number" name="children" value={formData.children} onChange={handleChange} min="0" required className="w-full pl-9 pr-3 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#25D366] focus:border-[#25D366] focus:bg-white outline-none transition-all text-gray-900" />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" disabled={isSubmitting} className="w-full bg-[#25D366] text-white py-4 px-6 rounded-xl font-bold hover:bg-[#20b858] transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-0.5 focus:ring-4 focus:ring-green-500/30 focus:outline-none flex items-center justify-center group mt-4 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none">
                        {isSubmitting ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Connecting...
                            </span>
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />Booking on WhatsApp
                            </>
                        )}
                    </button>
                </form>

                {/* Trust Badge */}
                <div className="bg-green-50/80 border border-green-100 rounded-xl p-3.5 flex items-start mt-5">
                    <ShieldCheck className="w-5 h-5 text-green-600 mr-2.5 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800 font-medium leading-relaxed">100% Direct Booking. No hidden platform fees. Chat directly with the local vendor.</p>
                </div>
            </div>
        </motion.div>
    );
}
