'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/helpers/authUtils';

export default function ReviewModerationPage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterRating, setFilterRating] = useState('all');

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/reviews', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setReviews(data.data.reviews || []);
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleVisibility = async (review) => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/reviews', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reviewId: review._id,
                    isVisible: !review.isVisible
                })
            });
            const data = await res.json();
            if (data.success) {
                setReviews(prev => prev.map(r => r._id === review._id ? { ...r, isVisible: !r.isVisible } : r));
            }
        } catch (error) {
            alert("Failed to update review status");
        }
    };

    const deleteReview = async (id) => {
        if (!confirm("Are you sure you want to delete this review permanently?")) return;
        try {
            const token = getToken();
            const res = await fetch(`/api/admin/reviews/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setReviews(prev => prev.filter(r => r._id !== id));
            }
        } catch (error) {
            alert("Failed to delete review");
        }
    };

    const filteredReviews = reviews.filter(r => {
        const matchesRating = filterRating === 'all' || r.rating.toString() === filterRating;
        return matchesRating;
    });

    const renderStars = (rating) => {
        return (
            <div className="flex text-amber-400 gap-1 mt-0.5">
                {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className={`w-3.5 h-3.5 ${star <= rating ? 'fill-current drop-shadow-[0_0_5px_rgba(251,191,36,0.6)]' : 'text-slate-800 fill-slate-800'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="p-8 min-h-[80vh] relative z-10 w-full overflow-hidden">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10 relative">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-5 pointer-events-none -z-10"></div>
                <div>
                    <h1 className="text-2xl font-bold font-mono text-cyan-50 tracking-tight flex items-center gap-3">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        Feedback Nexus
                    </h1>
                    <p className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-[0.2em] mt-2">Monitor and regulate user sentiment across the vendor matrix.</p>
                </div>
            </div>

            <div className="bg-[#111116] rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-[0.03] pointer-events-none"></div>
                <div className="p-5 border-b border-white/5 flex justify-between items-center relative z-10 bg-black/40 backdrop-blur-md">
                    <div className="flex gap-4 items-center">
                        <div className="relative group">
                            <select
                                className="appearance-none bg-black/60 border border-indigo-500/30 text-cyan-50 px-4 py-2 pr-10 rounded-lg text-[11px] font-mono font-bold uppercase tracking-widest outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer shadow-[inset_0_0_10px_rgba(34,211,238,0.1)] group-hover:border-cyan-500/50"
                                value={filterRating}
                                onChange={(e) => setFilterRating(e.target.value)}
                            >
                                <option value="all" className="bg-[#0a0a0f]">All Signals</option>
                                <option value="5" className="bg-[#0a0a0f]">Level 5 (Max)</option>
                                <option value="4" className="bg-[#0a0a0f]">Level 4</option>
                                <option value="3" className="bg-[#0a0a0f]">Level 3</option>
                                <option value="2" className="bg-[#0a0a0f]">Level 2</option>
                                <option value="1" className="bg-[#0a0a0f]">Level 1 (Crit)</option>
                            </select>
                            <svg className="w-4 h-4 text-cyan-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                    <div className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-[0.2em]">
                        {filteredReviews.length} Records Verified
                    </div>
                </div>

                <div className="divide-y divide-white/5 relative z-10">
                    {loading ? (
                        <div className="p-16 flex flex-col items-center justify-center">
                            <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                                <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-[spin_1.5s_linear_infinite]"></div>
                                <div className="absolute inset-1 rounded-full border-r-2 border-cyan-500 animate-[spin_2s_linear_infinite_reverse] opacity-70"></div>
                            </div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 animate-pulse">Scanning Nexus...</span>
                        </div>
                    ) : filteredReviews.length > 0 ? (
                        filteredReviews.map((review) => (
                            <div key={review._id} className={`p-6 hover:bg-[#0a0a0f] transition-all flex flex-col md:flex-row gap-6 group relative ${!review.isVisible ? 'opacity-40 grayscale-[0.8] hover:opacity-100' : ''}`}>
                                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-cyan-400 font-mono font-bold text-lg shadow-[inset_0_0_10px_rgba(34,211,238,0.2)]">
                                                {review.user?.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="font-bold font-mono text-cyan-50 tracking-tight">{review.user?.name || 'Ghost Protocol User'}</div>
                                                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-0.5">Vector: <span className="text-indigo-400">{review.vendor?.businessName || 'Unknown'}</span> <span className="mx-2">•</span> {new Date(review.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex bg-black/40 w-max px-3 py-1.5 rounded-lg border border-amber-500/20 shadow-[inset_0_0_10px_rgba(245,158,11,0.05)]">
                                        {renderStars(review.rating)}
                                    </div>
                                    
                                    <p className="text-slate-300 text-[13px] font-mono leading-relaxed max-w-4xl border-l-2 border-white/5 pl-4">{review.comment || <span className="italic text-slate-600">No transmission log provided.</span>}</p>

                                    {!review.isVisible && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[9px] font-mono font-bold uppercase tracking-widest shadow-[inset_0_0_10px_rgba(244,63,94,0.1)]">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                            Quarantined from Public Nexus
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-row md:flex-col gap-3 justify-center shrink-0">
                                    <button
                                        onClick={() => toggleVisibility(review)}
                                        className={`px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg border transition-all flex items-center justify-center gap-2 ${review.isVisible ? 'bg-black/50 border-white/10 text-slate-400 hover:border-white/20 hover:text-cyan-50' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}
                                    >
                                        {review.isVisible ? (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                                Hide Signal
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                Restore Signal
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => deleteReview(review._id)}
                                        className="px-4 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/20 hover:border-rose-400/50 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Purge Record
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-8 py-24 text-center">
                            <div className="inline-flex w-16 h-16 items-center justify-center rounded-full bg-indigo-500/10 mb-4 border border-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.2)]">
                                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            </div>
                            <h3 className="text-[13px] font-mono font-bold text-cyan-50 uppercase tracking-[0.2em] mb-2">Zero Signals Detected</h3>
                            <p className="text-[11px] font-mono text-slate-500">No feedback matching your current query parameters.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
