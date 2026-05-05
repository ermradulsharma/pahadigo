'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { setToken, getToken, getRole } from '@/core/Helpers/authUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Mail, ArrowRight, Loader2, Cpu, Zap, Ghost } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    const role = getRole();
    if (token && role) {
      if (role === 'admin') router.push('/admin');
      else if (role === 'vendor') router.push('/vendor');
      else if (role === 'traveller') router.push('/traveller');
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const response = await res.json();

      if (res.ok) {
        const data = response.data || response;
        setToken(data.token, data.role, rememberMe);

        if (data.role === 'admin') router.push('/admin');
        else if (data.role === 'vendor') router.push('/vendor');
        else router.push('/traveller');
      } else {
        setError(response.message || response.error || 'Identity verification failed');
      }
    } catch (err) {
      setError('Communication breach: ' + (err.message || 'Server unreachable'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const response = await res.json();
      if (res.ok) {
        setMessage('Access recovery sequence initiated. Check your uplink.');
      } else {
        setError(response.message || 'Recovery failed');
      }
    } catch (err) {
      setError('Uplink error: ' + (err.message || 'Network failure'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 sm:p-6 overflow-hidden relative font-sans">
      {/* Background Matrix Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20"></div>
      
      {/* Dynamic Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4 group">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-16 h-16 bg-gray-900 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Shield className="w-8 h-8 text-indigo-400" />
                </div>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tighter mb-2">PahadiGo<span className="text-indigo-500">.</span></h1>
            <div className="flex items-center gap-2">
                <div className="h-[1px] w-8 bg-white/10"></div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-500">Governance Gateway</p>
                <div className="h-[1px] w-8 bg-white/10"></div>
            </div>
        </div>

        {/* Login Card */}
        <div className="bg-gray-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
            
            <AnimatePresence mode="wait">
                {!isForgotPassword ? (
                    <motion.div 
                        key="login"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-white mb-1">Authenticate Identity</h2>
                            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Input credentials to access neural hub</p>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-[11px] font-mono flex items-center gap-3">
                                <Zap className="w-4 h-4 shrink-0" /> {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 ml-1">Uplink Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>
                                    <input 
                                        required 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        type="email" 
                                        placeholder="admin@pahadigo.com"
                                        className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-1 px-1">
                                    <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Secure Protocol</label>
                                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">Lost Access?</button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>
                                    <input 
                                        required 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        type="password" 
                                        placeholder="••••••••"
                                        className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" 
                                    />
                                </div>
                            </div>

                            <div className="flex items-center px-1 py-1">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input 
                                            type="checkbox" 
                                            checked={rememberMe} 
                                            onChange={(e) => setRememberMe(e.target.checked)} 
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded border border-white/10 flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-black/40 group-hover:border-white/20'}`}>
                                            {rememberMe && <Zap className="w-3 h-3 text-white fill-white" />}
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition-colors">Maintain Session Persistence</span>
                                </label>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full relative group"
                            >
                                <div className="absolute inset-0 bg-indigo-600 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative flex items-center justify-center gap-3 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all shadow-xl disabled:opacity-50">
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Access Matrix <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </div>
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="forgot"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-white mb-1">Recover Uplink</h2>
                            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Initiate emergency reset protocol</p>
                        </div>

                        {message && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-[11px] font-mono flex items-center gap-3">
                                <Ghost className="w-4 h-4 shrink-0" /> {message}
                            </motion.div>
                        )}

                        <form onSubmit={handleForgotPassword} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-slate-400 ml-1">Target Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                    </div>
                                    <input 
                                        required 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)} 
                                        type="email" 
                                        placeholder="admin@pahadigo.com"
                                        className="block w-full pl-11 pr-4 py-3 bg-black/40 border border-white/5 rounded-2xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" 
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full relative group"
                            >
                                <div className="absolute inset-0 bg-emerald-600 blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative flex items-center justify-center gap-3 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm tracking-widest uppercase transition-all shadow-xl disabled:opacity-50">
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Send Recovery Code <Cpu className="w-4 h-4" /></>
                                    )}
                                </div>
                            </button>

                            <div className="text-center pt-4">
                                <button type="button" onClick={() => setIsForgotPassword(false)} className="text-[10px] font-mono uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Back to Authentication</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Security Footer */}
        <div className="mt-8 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600">SSL Encrypted</span>
            </div>
            <div className="h-3 w-[1px] bg-white/5"></div>
            <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-slate-600">RSA-4096 Secure</span>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
