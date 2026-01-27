'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getToken } from '../../../helpers/authUtils';
import 'react-quill-new/dist/quill.snow.css'; // Optimized for React 19
// Actually, let's use dynamic import for ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const POLICY_TYPES = {
    vendor: [
        { id: 'privacy_policy', label: 'Privacy Policy' },
        { id: 'terms_conditions', label: 'Terms & Conditions' }
    ],
    traveller: [
        { id: 'privacy_policy', label: 'Privacy Policy' },
        { id: 'terms_conditions', label: 'Terms & Conditions' },
        { id: 'refund_policy', label: 'Refund Policy' },
        { id: 'cancellation_policy', label: 'Cancellation Policy' }
    ]
};

export default function PoliciesPage() {
    const [target, setTarget] = useState('vendor');
    const [type, setType] = useState('privacy_policy');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    const fetchPolicies = useCallback(async () => {
        if (!isMounted) return;
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch('/api/admin/policies', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                const data = await res.json();
                const fetchedPolicies = data.data?.policies || [];

                // Set initial content for current selection
                const current = fetchedPolicies.find(p => p.target === target && p.type === type);
                setContent(current ? current.content : '');
            }
        } catch (e) {
        } finally {
            setLoading(false);
        }
    }, [target, type, isMounted]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted) {
            fetchPolicies();
        }
    }, [target, type, fetchPolicies, isMounted]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = getToken();
            const res = await fetch('/api/admin/policies', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ target, type, content })
            });
            if (res.ok) {
                alert('Policy saved successfuly!');
                fetchPolicies();
            } else {
                alert('Failed to save policy');
            }
        } catch (e) {
            alert('Error saving policy');
        } finally {
            setSaving(false);
        }
    };

    if (!isMounted) return null;

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };
    const currentTypeLabel = POLICY_TYPES[target]?.find(p => p.id === type)?.label || 'Policy';
    return (
        <div className="p-8 max-w-full">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Policy Management</h1>
                <p className="text-slate-500 mt-2">Create and update legal policies for your platform</p>
            </header>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[700px]">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-100 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-8">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block">Target Audience</label>
                        <div className="flex p-1 bg-slate-200 rounded-xl">
                            <button onClick={() => { setTarget('vendor'); setType('privacy_policy'); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${target === 'vendor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}> Vendors </button>
                            <button onClick={() => { setTarget('traveller'); setType('privacy_policy'); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${target === 'traveller' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}> Travellers </button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block">Policy Type</label>
                        <nav className="space-y-1">
                            {POLICY_TYPES[target]?.map((p) => (
                                <button key={p.id} onClick={() => setType(p.id)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${type === p.id ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}> {p.label} </button>
                            ))}
                        </nav>
                    </div>
                    <button onClick={handleSave} disabled={saving || loading} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${saving ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200'}`}>
                        {saving ? (
                            <> <svg className="animate-spin h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Saving... </>) : (
                            <> <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> Save Changes </>
                        )}
                    </button>
                </aside>

                {/* Editor Content Area */}
                <main className="flex-1 flex flex-col p-8 overflow-hidden">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-slate-800">{currentTypeLabel}</h2>
                        <p className="text-sm text-slate-400 italic">Target: {target.charAt(0).toUpperCase() + target.slice(1)}</p>
                    </div>
                    <div className="flex-1 relative border rounded-xl overflow-hidden bg-white border-slate-200 min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-white bg-opacity-70 z-10 flex items-center justify-center font-medium text-slate-500">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="animate-pulse bg-slate-200 h-10 w-48 rounded"></div> Loading content...
                                </div>
                            </div>
                        )}
                        <ReactQuill theme="snow" value={content} onChange={setContent} modules={modules} className="h-full flex flex-col" style={{ border: 'none' }} />
                    </div>
                </main>
            </div>
            <style jsx global>{`
                .quill {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                .ql-container {
                    flex: 1;
                    font-size: 16px;
                    font-family: inherit;
                    border: none !important;
                    min-height: 350px;
                }
                .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    background: #f8fafc;
                    padding: 12px !important;
                }
                .ql-editor {
                    padding: 24px !important;
                    background: white;
                    min-height: 350px;
                }
                .ql-editor p {
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
}
