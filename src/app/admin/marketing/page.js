'use client';

import { useState, useEffect } from 'react';
import { getToken } from '../../../helpers/authUtils';

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState('banners');

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Marketing & Promotions</h1>
                <p className="text-gray-500">Manage app banners and discount coupons</p>
            </header>

            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('banners')}
                    className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'banners' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                >
                    Home Banners
                </button>
                <button
                    onClick={() => setActiveTab('coupons')}
                    className={`pb-3 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'coupons' ? 'text-indigo-600 border-indigo-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                >
                    Coupons
                </button>
            </div>

            {activeTab === 'banners' ? <BannersManager /> : <CouponsManager />}
        </div>
    );
}

function BannersManager() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', link: '', position: 0 });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const res = await fetch('/api/admin/marketing/banners');
            constdata = await res.json();
            if (data.success) setBanners(data.data.banners || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            const res = await fetch('/api/admin/marketing/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newBanner)
            });
            const data = await res.json();
            if (data.success) {
                setBanners(prev => [data.data.banner, ...prev]);
                setNewBanner({ title: '', imageUrl: '', link: '', position: 0 });
                alert("Banner created!");
            } else {
                alert(data.error || "Failed to create");
            }
        } catch (e) { alert("Error occurred"); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this banner?")) return;
        try {
            const token = getToken();
            await fetch(`/api/admin/marketing/banners/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setBanners(prev => prev.filter(b => b._id !== id));
        } catch (e) { }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Banner</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Title (Optional)</label>
                            <input className="w-full px-3 py-2 border rounded-lg text-sm" value={newBanner.title} onChange={e => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="Summer Sale" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Image URL <span className="text-red-500">*</span></label>
                            <input className="w-full px-3 py-2 border rounded-lg text-sm" required value={newBanner.imageUrl} onChange={e => setNewBanner({ ...newBanner, imageUrl: e.target.value })} placeholder="https://..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Deep Link / URL</label>
                            <input className="w-full px-3 py-2 border rounded-lg text-sm" value={newBanner.link} onChange={e => setNewBanner({ ...newBanner, link: e.target.value })} placeholder="/packages/trekking" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Position Order</label>
                            <input className="w-full px-3 py-2 border rounded-lg text-sm" type="number" value={newBanner.position} onChange={e => setNewBanner({ ...newBanner, position: parseInt(e.target.value) })} />
                        </div>
                        <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700">Add Banner</button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
                {loading ? <div className="text-center py-10">Loading...</div> :
                    banners.map(banner => (
                        <div key={banner._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
                            <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-gray-800">{banner.title || 'Untitled Banner'}</div>
                                <div className="text-xs text-gray-500 truncate">{banner.link || 'No link'}</div>
                            </div>
                            <button onClick={() => handleDelete(banner._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))
                }
                {!loading && banners.length === 0 && <div className="text-gray-400 text-center italic py-10">No active banners</div>}
            </div>
        </div>
    );
}

function CouponsManager() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percentage', value: 0, minOrderAmount: 0, expiryDate: '' });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const token = getToken();
            const res = await fetch('/api/admin/marketing/coupons', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setCoupons(data.data.coupons || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            const res = await fetch('/api/admin/marketing/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newCoupon)
            });
            const data = await res.json();
            if (data.success) {
                setCoupons(prev => [data.data.coupon, ...prev]);
                alert("Coupon created!");
                setNewCoupon({ code: '', discountType: 'percentage', value: 0, minOrderAmount: 0, expiryDate: '' });
            } else {
                alert(data.error || "Failed");
            }
        } catch (e) { alert("Error occurred"); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this coupon?")) return;
        try {
            const token = getToken();
            await fetch(`/api/admin/marketing/coupons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCoupons(prev => prev.filter(c => c._id !== id));
        } catch (e) { }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Create Coupon</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Code <span className="text-red-500">*</span></label>
                            <input className="w-full px-3 py-2 border rounded-lg text-sm uppercase font-mono" required value={newCoupon.code} onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Type</label>
                                <select className="w-full px-3 py-2 border rounded-lg text-sm" value={newCoupon.discountType} onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}>
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount (₹)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Value</label>
                                <input className="w-full px-3 py-2 border rounded-lg text-sm" type="number" required value={newCoupon.value} onChange={e => setNewCoupon({ ...newCoupon, value: parseFloat(e.target.value) })} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Min Order Amount</label>
                            <input className="w-full px-3 py-2 border rounded-lg text-sm" type="number" value={newCoupon.minOrderAmount} onChange={e => setNewCoupon({ ...newCoupon, minOrderAmount: parseFloat(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Expiry Date <span className="text-red-500">*</span></label>
                            <input className="w-full px-3 py-2 border rounded-lg text-sm" type="date" required value={newCoupon.expiryDate} onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })} />
                        </div>
                        <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700">Create Coupon</button>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-4">
                {loading ? <div className="text-center py-10">Loading...</div> :
                    coupons.map(coupon => (
                        <div key={coupon._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-lg font-bold text-indigo-700 tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{coupon.code}</span>
                                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">Active</span>
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    Get {coupon.value}{coupon.discountType === 'percentage' ? '%' : '₹'} off
                                    {coupon.minOrderAmount > 0 && ` on orders above ₹${coupon.minOrderAmount}`}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">Expires: {new Date(coupon.expiryDate).toLocaleDateString()}</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-gray-800">{coupon.usedCount || 0}</div>
                                    <div className="text-[10px] uppercase text-gray-400 font-bold">Used</div>
                                </div>
                                <button onClick={() => handleDelete(coupon._id)} className="text-red-400 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                }
                {!loading && coupons.length === 0 && <div className="text-gray-400 text-center italic py-10">No active coupons</div>}
            </div>
        </div>
    );
}
