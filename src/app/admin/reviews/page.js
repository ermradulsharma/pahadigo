'use client';

import { useState, useEffect } from 'react';
import { getToken } from '../../../helpers/authUtils';

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
            <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} className={`w-4 h-4 ${star <= rating ? 'fill-current' : 'text-gray-200'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Review Moderation</h1>
                <p className="text-gray-500">Monitor and manage user feedback and ratings</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <div className="flex gap-2">
                        <select
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value)}
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                        Total {filteredReviews.length} Reviews
                    </div>
                </div>

                <div className="divide-y divide-gray-50 italic-rows">
                    {loading ? (
                        [1, 2, 3].map(i => <div key={i} className="p-6 animate-pulse bg-gray-50/50 h-24"></div>)
                    ) : filteredReviews.length > 0 ? (
                        filteredReviews.map((review) => (
                            <div key={review._id} className={`p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row gap-6 ${!review.isVisible ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {review.user?.name?.[0] || '?'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-800">{review.user?.name || 'Anonymous User'}</div>
                                            <div className="text-xs text-gray-400">Reviewed {review.vendor?.businessName} • {new Date(review.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="mb-2">{renderStars(review.rating)}</div>
                                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment || <span className="italic">No comment provided</span>}</p>

                                    {!review.isVisible && (
                                        <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                                            Hidden from public
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-row md:flex-col gap-2 justify-center shrink-0">
                                    <button
                                        onClick={() => toggleVisibility(review)}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${review.isVisible ? 'border-gray-200 text-gray-600 hover:bg-gray-100' : 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                    >
                                        {review.isVisible ? 'Hide Review' : 'Show Review'}
                                    </button>
                                    <button
                                        onClick={() => deleteReview(review._id)}
                                        className="px-4 py-2 text-xs font-bold rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-all"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-20 text-center text-gray-400 italic">No reviews found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
