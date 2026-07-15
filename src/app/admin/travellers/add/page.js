"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/core/Api/index.js';
import Link from 'next/link';
import { User, Mail, Phone, Lock, ArrowLeft, PlusCircle, ShieldCheck } from 'lucide-react';
import Loading from '@/components/admin/Loading.js';
import { motion } from 'framer-motion';

export default function AddTravellerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '' // Optional initial password
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.admin.travellers.create(formData);
      router.push('/admin/travellers');
    } catch (err) {
      setError(err.message || 'An error occurred while creating the traveller');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Initializing User Creation Node..." />;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 relative selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
      
      <main className="max-w-2xl mx-auto px-6 pt-12 pb-24 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <PlusCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Register Node</h1>
              <p className="text-xs font-mono text-indigo-400/70 uppercase tracking-widest mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> New Traveller Protocol
              </p>
            </div>
          </div>
          <Link href="/admin/travellers" className="group flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-white transition-all uppercase tracking-widest">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Return to Matrix
          </Link>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl mb-8 flex items-center gap-3 animate-shake">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
              <p className="text-xs font-mono text-rose-400 uppercase tracking-wider">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] ml-1">Identity Tag</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-black/40 pl-11 pr-4 py-3.5 border border-white/5 rounded-xl text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700"
                    placeholder="Full legal name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] ml-1">Comms Uplink</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-black/40 pl-11 pr-4 py-3.5 border border-white/5 rounded-xl text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-mono"
                    placeholder="protocol@network.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] ml-1">Signal frequency</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-black/40 pl-11 pr-4 py-3.5 border border-white/5 rounded-xl text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-mono"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] ml-1">Access Credentials</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-black/40 pl-11 pr-4 py-3.5 border border-white/5 rounded-xl text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all placeholder:text-slate-700 font-mono"
                    placeholder="********"
                    minLength={6}
                  />
                </div>
                <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest mt-2 ml-1">Security Level: High (Min. 6 Chars)</p>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-xl blur group-hover:blur-md transition-all opacity-50"></div>
                <div className="relative flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-500 transition-all shadow-xl group-active:scale-[0.98]">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="uppercase tracking-widest text-xs font-mono">Initialize Protocol</span>
                </div>
              </button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );

}
