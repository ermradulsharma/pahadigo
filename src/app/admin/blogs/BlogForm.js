"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, Save, Loader2, Image as ImageIcon, FileText, 
    Settings, Tag, Eye, Type, AlignLeft, CalendarClock, Globe
} from 'lucide-react';
import api from '@/core/Api/index.js';
import { useToast } from '@/components/ui/ToastContext.js';
import Button from '@/components/ui/Button.js';

export default function BlogForm({ initialData = null }) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        excerpt: initialData?.excerpt || '',
        content: initialData?.content || '',
        coverImage: initialData?.coverImage || '',
        tags: initialData?.tags?.join(', ') || '',
        status: initialData?.status || 'draft'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            ...formData,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        };

        try {
            let res;
            if (initialData) {
                res = await api.admin.blogs.update(initialData._id, payload);
            } else {
                res = await api.admin.blogs.create(payload);
            }

            if (res.success) {
                toast(`Blog ${initialData ? 'updated' : 'published'} successfully!`, 'success');
                setTimeout(() => router.push('/admin/blogs'), 1500);
            } else {
                toast(res.error || 'Operation failed', 'error');
                setIsSubmitting(false);
            }
        } catch (error) {
            toast('An error occurred. Please try again.', 'error');
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/blogs" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors border border-white/10 shadow-lg group">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <FileText className="w-8 h-8 text-indigo-400 opacity-80" />
                            {initialData ? 'Edit Publication' : 'New Publication'}
                        </h1>
                        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-2 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${formData.status === 'published' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}></span>
                            Current Status: <span className={formData.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}>{formData.status}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/admin/blogs')}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isSubmitting}
                        disabled={!formData.title || !formData.content}
                    >
                        {initialData ? 'Update Blog' : 'Publish Blog'}
                    </Button>
                </div>
            </div>

            <form id="blogForm" onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-[#111116] border border-white/5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-white/[0.01]">
                            <h2 className="text-sm font-mono tracking-widest text-white uppercase flex items-center gap-2">
                                <Type className="w-4 h-4 text-indigo-400" /> Core Details
                            </h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <input 
                                    type="text" 
                                    name="title" 
                                    required 
                                    value={formData.title} 
                                    onChange={handleChange} 
                                    className="w-full px-0 py-2 bg-transparent border-0 border-b-2 border-white/10 focus:border-indigo-500 text-3xl font-bold text-white placeholder-slate-600 focus:ring-0 transition-colors"
                                    placeholder="Enter a compelling title..."
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest mb-3">
                                    <AlignLeft className="w-3 h-3" /> Excerpt Summary
                                </label>
                                <textarea 
                                    name="excerpt" 
                                    rows="2"
                                    value={formData.excerpt} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-3 bg-[#0a0a0c] border border-white/10 rounded-xl text-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm"
                                    placeholder="Briefly summarize what this post is about (used in SEO and cards)..."
                                ></textarea>
                                <div className="text-right mt-1 text-[10px] font-mono text-slate-500">
                                    {formData.excerpt.length} / 160 recommended
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#111116] border border-white/5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[600px]">
                        <div className="p-4 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                            <h2 className="text-sm font-mono tracking-widest text-white uppercase flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-400" /> Content Editor
                            </h2>
                            <div className="flex bg-white/5 rounded-lg p-1">
                                <button type="button" onClick={() => setActiveTab('write')} className={`px-4 py-1.5 text-xs font-mono tracking-widest uppercase rounded-md transition-all ${activeTab === 'write' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Write</button>
                                <button type="button" onClick={() => setActiveTab('preview')} className={`px-4 py-1.5 text-xs font-mono tracking-widest uppercase rounded-md transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}><Eye className="w-3 h-3" /> Preview</button>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-0 relative">
                            {activeTab === 'write' ? (
                                <textarea 
                                    name="content" 
                                    required 
                                    value={formData.content} 
                                    onChange={handleChange} 
                                    className="absolute inset-0 w-full h-full p-6 bg-[#0a0a0c] border-0 text-slate-300 outline-none resize-none font-mono text-[13px] leading-loose custom-scrollbar focus:ring-inset focus:ring-1 focus:ring-indigo-500/50"
                                    placeholder="# Welcome to your new post...&#10;&#10;Write your content in Markdown or HTML here.&#10;&#10;## Features&#10;- Bullet points&#10;- **Bold text**&#10;- [Links](https://pahadigo.com)"
                                ></textarea>
                            ) : (
                                <div className="absolute inset-0 w-full h-full p-8 bg-white overflow-y-auto custom-scrollbar">
                                    {/* A simple preview simulation */}
                                    <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: formData.content ? formData.content.replace(/\n/g, '<br/>') : '<p class="text-gray-400 italic">No content to preview.</p>' }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Media Settings */}
                    <div className="bg-[#111116] border border-white/5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-pink-500/10 transition-colors"></div>
                        <div className="p-5 border-b border-white/5 relative z-10">
                            <h2 className="text-sm font-mono tracking-widest text-white uppercase flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-pink-400" /> Media & Cover
                            </h2>
                        </div>
                        <div className="p-5 space-y-4 relative z-10">
                            {formData.coverImage ? (
                                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/10 group/img">
                                    <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button type="button" size="sm" variant="danger" onClick={() => setFormData(p => ({...p, coverImage: ''}))}>Remove</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-40 border-2 border-dashed border-white/10 rounded-xl bg-[#0a0a0c] flex flex-col items-center justify-center text-slate-500">
                                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-[10px] font-mono uppercase tracking-widest">No Cover Image</span>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Image URL</label>
                                <input 
                                    type="url" 
                                    name="coverImage" 
                                    value={formData.coverImage} 
                                    onChange={handleChange} 
                                    className="w-full px-3 py-2.5 bg-[#0a0a0c] border border-white/10 rounded-lg text-slate-300 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all text-xs"
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Publish Settings */}
                    <div className="bg-[#111116] border border-white/5 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
                        <div className="p-5 border-b border-white/5 bg-white/[0.01]">
                            <h2 className="text-sm font-mono tracking-widest text-white uppercase flex items-center gap-2">
                                <Settings className="w-4 h-4 text-indigo-400" /> Publishing
                            </h2>
                        </div>
                        <div className="p-5 space-y-5">
                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                                    <Globe className="w-3 h-3" /> Visibility Status
                                </label>
                                <select 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={handleChange} 
                                    className="w-full px-3 py-2.5 bg-[#0a0a0c] border border-white/10 rounded-lg text-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none text-sm cursor-pointer"
                                >
                                    <option value="draft">Draft - Hidden from public</option>
                                    <option value="published">Published - Live on site</option>
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                                    <Tag className="w-3 h-3" /> Categorization Tags
                                </label>
                                <input 
                                    type="text" 
                                    name="tags" 
                                    value={formData.tags} 
                                    onChange={handleChange} 
                                    className="w-full px-3 py-2.5 bg-[#0a0a0c] border border-white/10 rounded-lg text-slate-300 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                                    placeholder="Adventure, Travel, Tips"
                                />
                                <p className="text-[9px] text-slate-500 mt-1.5 font-mono">Separate tags with commas.</p>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="bg-[#111116] border border-white/5 rounded-2xl p-5 text-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-center mb-2"><CalendarClock className="w-5 h-5 text-slate-600" /></div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                            {initialData ? `Last updated: ${new Date().toLocaleDateString()}` : 'Ready to publish'}
                        </p>
                    </div>
                </div>
            </form>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>

        </motion.div>
    );
}
