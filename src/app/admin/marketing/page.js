'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/core/Helpers/authUtils';
import { Megaphone, Image as ImageIcon, Tag, Plus, Trash2, Calendar, Link2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import Loading from '@/components/admin/Loading';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('banners');

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-[80vh]">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-indigo-400 opacity-80" /> Marketing & Promotions
          </h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-2">Campaigns & Offers Control</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 bg-[#111116] p-1.5 rounded-xl border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.5)] w-fit">
        <button
          onClick={() => setActiveTab('banners')}
          className={`px-6 py-2.5 text-xs font-mono tracking-widest uppercase rounded-lg transition-all flex items-center gap-2 ${activeTab === 'banners' ? 'bg-indigo-500/20 text-indigo-400 font-bold border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
        >
          <ImageIcon className="w-4 h-4" /> Home Banners
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-6 py-2.5 text-xs font-mono tracking-widest uppercase rounded-lg transition-all flex items-center gap-2 ${activeTab === 'coupons' ? 'bg-pink-500/20 text-pink-400 font-bold border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}
        >
          <Tag className="w-4 h-4" /> Coupon Codes
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'banners' ? <BannersManager /> : <CouponsManager />}
      </motion.div>
    </div>
  );
}

function BannersManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', link: '', position: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/admin/marketing/banners', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setBanners(data.data.banners || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = getToken();
      const res = await fetch('/api/admin/marketing/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newBanner)
      });
      const data = await res.json();
      if (data.success) {
        setBanners(prev => [data.data.banner, ...prev].sort((a, b) => a.position - b.position));
        setNewBanner({ title: '', imageUrl: '', link: '', position: 0 });
      } else {
        alert(data.error || "Failed to create banner");
      }
    } catch (e) {
      alert("Error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this banner from the matrix?")) return;
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
      {/* Form Section */}
      <div className="lg:col-span-1">
        <div className="bg-[#111116] p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-sm font-mono tracking-widest text-indigo-400 uppercase flex items-center gap-2 mb-6">
            <Plus className="w-4 h-4" /> Add Banner
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Title (Optional)</label>
              <input
                className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600"
                value={newBanner.title}
                onChange={e => setNewBanner({ ...newBanner, title: e.target.value })}
                placeholder="Summer Edition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Image URL <span className="text-rose-500">*</span></label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  className="w-full bg-black/40 pl-10 pr-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-mono"
                  required
                  value={newBanner.imageUrl}
                  onChange={e => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Deep Link / Target URL</label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  className="w-full bg-black/40 pl-10 pr-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-mono"
                  value={newBanner.link}
                  onChange={e => setNewBanner({ ...newBanner, link: e.target.value })}
                  placeholder="/packages/trekking"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Sort Position</label>
              <input
                className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-mono"
                type="number"
                value={newBanner.position}
                onChange={e => setNewBanner({ ...newBanner, position: e.target.value ? parseInt(e.target.value) : 0 })}
              />
            </div>
            <button
              disabled={isSaving}
              className={`w-full py-3 mt-2 text-white font-mono text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] border flex items-center justify-center gap-2 ${isSaving ? 'bg-indigo-600/50 border-indigo-500/20 cursor-not-allowed' : 'bg-indigo-600/20 border-indigo-500/40 hover:bg-indigo-600/40 text-indigo-100 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'}`}
            >
              {isSaving ? 'Deploying...' : 'Deploy Banner'}
            </button>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className="lg:col-span-2 space-y-4">
        {loading ? (
          <Loading message="Fetching Banners..." />
        ) : (
          banners.map(banner => (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              key={banner._id}
              className="bg-[#111116] p-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 hover:border-indigo-500/30 transition-colors flex gap-5 items-center group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-40 h-24 bg-black/50 rounded-lg overflow-hidden flex-shrink-0 border border-white/5 relative group/img">
                <img src={banner.imageUrl} alt="" className="w-full h-full object-cover group-hover/img:scale-110 group-hover/img:opacity-80 transition-all duration-700 opacity-80 mix-blend-luminosity" />
                <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-300 border border-white/10">POS: {banner.position || 0}</div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-200 text-sm group-hover:text-indigo-400 transition-colors">{banner.title || 'Untitled Banner Artifact'}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-2 truncate max-w-sm flex items-center gap-1.5">
                  <Link2 className="w-3 h-3 text-slate-600" /> {banner.link || 'Empty Vector'}
                </div>
              </div>
              <button
                onClick={() => handleDelete(banner._id)}
                className="text-slate-500 hover:text-rose-400 p-2 rounded-lg bg-white/5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        )}
        {!loading && banners.length === 0 && (
          <div className="text-center py-16 text-xs font-mono tracking-widest uppercase text-slate-500 bg-[#111116] rounded-2xl border border-white/5 border-dashed">
            NULL OUTPUT: No banners active.
          </div>
        )}
      </div>
    </div>
  );
}

function CouponsManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percentage', value: 0, minOrderAmount: 0, expiryDate: '' });
  const [isSaving, setIsSaving] = useState(false);

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
    setIsSaving(true);
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
        setNewCoupon({ code: '', discountType: 'percentage', value: 0, minOrderAmount: 0, expiryDate: '' });
      } else {
        alert(data.error || "Failed to generate coupon code");
      }
    } catch (e) {
      alert("Error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon code?")) return;
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
        <div className="bg-[#111116] p-6 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <h3 className="text-sm font-mono tracking-widest text-pink-400 uppercase flex items-center gap-2 mb-6">
            <Plus className="w-4 h-4" /> Generate Coupon
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex justify-between">
                <span>Code <span className="text-rose-500">*</span></span>
              </label>
              <input
                className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-pink-400 uppercase font-mono tracking-wider focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 outline-none transition-all placeholder:text-slate-600 shadow-[0_0_10px_rgba(236,72,153,0.05) inset]"
                required
                value={newCoupon.code}
                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-slate-500" /> Type
                </label>
                <select
                  className="w-full bg-black/40 px-3 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 font-mono"
                  value={newCoupon.discountType}
                  onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                >
                  <option value="percentage" className="bg-[#111116]">Percent (%)</option>
                  <option value="fixed" className="bg-[#111116]">Fixed (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Value</label>
                <input
                  className="w-full bg-black/40 px-3 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 outline-none transition-all font-mono placeholder:text-slate-600"
                  type="number"
                  required
                  value={newCoupon.value}
                  onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value ? parseFloat(e.target.value) : 0 })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-slate-500" /> Min Order Threshold
              </label>
              <input
                className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 outline-none transition-all font-mono placeholder:text-slate-600"
                type="number"
                value={newCoupon.minOrderAmount}
                onChange={e => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value ? parseFloat(e.target.value) : 0 })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-500" /> Date of Expiry <span className="text-rose-500">*</span>
              </label>
              <input
                className="w-full bg-black/40 px-4 py-2.5 border border-white/10 rounded-lg text-sm text-slate-200 focus:ring-1 focus:ring-pink-500/50 focus:border-pink-500/50 outline-none transition-all font-mono color-scheme-dark"
                type="date"
                required
                style={{ colorScheme: "dark" }}
                value={newCoupon.expiryDate}
                onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
              />
            </div>
            <button
              disabled={isSaving}
              className={`w-full py-3 mt-2 text-white font-mono text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(236,72,153,0.2)] border flex items-center justify-center gap-2 ${isSaving ? 'bg-pink-600/50 border-pink-500/20 cursor-not-allowed' : 'bg-pink-600/20 border-pink-500/40 hover:bg-pink-600/40 text-pink-100 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)]'}`}
            >
              {isSaving ? 'Generating...' : 'Generate Code'}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        {loading ? (
          <Loading message="Decrypting Codes..." />
        ) : (
          coupons.map(coupon => {
            const isExpired = new Date(coupon.expiryDate) < new Date();
            return (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key={coupon._id}
                className={`bg-[#111116] p-5 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border ${isExpired ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-pink-500/30'} flex justify-between items-center group relative overflow-hidden transition-all`}
              >
                {!isExpired && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-pink-500/50 to-transparent"></div>}

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-3">
                    <span className="font-mono text-xl font-black text-pink-400 tracking-[0.2em] bg-pink-500/10 px-3 py-1 rounded shadow-[0_0_10px_rgba(236,72,153,0.15)] border border-pink-500/20 group-hover:bg-pink-500/20 transition-colors uppercase">
                      {coupon.code}
                    </span>
                    {isExpired ? (
                      <span className="text-[9px] font-mono tracking-widest bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded shadow-sm">EXPIRED</span>
                    ) : (
                      <span className="text-[9px] font-mono tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse">ACTIVE</span>
                    )}
                  </div>
                  <div className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_#6366f1]"></span>
                    Reduction: <span className="font-mono font-bold text-indigo-400">{coupon.value}{coupon.discountType === 'percentage' ? '%' : '₹'}</span>
                    {coupon.minOrderAmount > 0 && <span className="text-slate-500 text-xs">(Min. Transaction: ₹{coupon.minOrderAmount})</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Terminus: {new Date(coupon.expiryDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-6 relative z-10 pl-4 border-l border-white/5">
                  <div className="text-center group-hover:scale-105 transition-transform">
                    <div className="text-3xl font-mono font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">{coupon.usedCount || 0}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono mt-1">Times Used</div>
                  </div>
                  <button
                    onClick={() => handleDelete(coupon._id)}
                    className="text-slate-500 hover:text-rose-400 p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all shadow-sm group-hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
        {!loading && coupons.length === 0 && (
          <div className="text-center py-16 text-xs font-mono tracking-widest uppercase text-slate-500 bg-[#111116] rounded-2xl border border-white/5 border-dashed">
            NULL OUTPUT: No promo codes found.
          </div>
        )}
      </div>
    </div>
  );
}
