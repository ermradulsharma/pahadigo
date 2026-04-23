'use client';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { getToken } from '@/core/Helpers/authUtils';
import { DefaultEditor } from 'react-simple-wysiwyg';
import { Shield, BookOpen, Save, RefreshCw, Users, Server, Briefcase } from 'lucide-react';

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
  ],
  admin: [
    { id: 'privacy_policy', label: 'Privacy Policy' },
    { id: 'terms_conditions', label: 'Terms & Conditions' }
  ]
};

export default function PoliciesPage() {
  const [target, setTarget] = useState('admin');
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
      console.error('Failed to fetch policies');
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
        alert('Policy matrix updated successfully!');
        fetchPolicies();
      } else {
        alert('Failed to update policy matrix.');
      }
    } catch (e) {
      alert('Error updating policy matrix.');
    } finally {
      setSaving(false);
    }
  };

  if (!isMounted) return null;

  const currentTypeLabel = POLICY_TYPES[target]?.find(p => p.id === type)?.label || 'Policy Node';

  const renderTargetIcon = (t) => {
    switch (t) {
      case 'admin': return <Server className="w-4 h-4" />;
      case 'vendor': return <Briefcase className="w-4 h-4" />;
      case 'traveller': return <Users className="w-4 h-4" />;
      default: return null;
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen flex flex-col">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4 border-b border-white/10 pb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Shield className="w-7 h-7 text-cyan-400 opacity-80" /> Legal & Policy Matrix
          </h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-2">Core System Rules & Directives Configuration</p>
        </div>
      </div>

      <div className="bg-[#111116] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 flex flex-col md:flex-row flex-1 relative">

        {/* Sidebar Navigation */}
        <aside className="w-full md:w-80 bg-black/40 border-r border-white/10 p-6 flex flex-col gap-8 relative z-10 shrink-0">
          <div>
            <label className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
              <Server className="w-3 h-3" /> Target Entity
            </label>
            <div className="flex flex-col gap-2 p-1.5 bg-white/5 rounded-xl border border-white/5">
              {['admin', 'vendor', 'traveller'].map((t) => (
                <button
                  key={t}
                  onClick={() => { setTarget(t); setType('privacy_policy'); }}
                  className={`flex items-center gap-3 px-4 py-2.5 text-xs font-mono tracking-widest uppercase rounded-lg transition-all ${target === t ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
                >
                  {renderTargetIcon(t)} {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="text-[10px] font-mono text-cyan-500/70 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
              <BookOpen className="w-3 h-3" /> Directive Nodes
            </label>
            <nav className="space-y-2">
              {POLICY_TYPES[target]?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setType(p.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 border ${type === p.id ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${type === p.id ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-slate-600'}`}></div>
                  {p.label}
                </button>
              ))}
            </nav>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`w-full py-3.5 rounded-xl text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-2 transition-all border ${saving ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 border-cyan-500/30 hover:border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]'}`}
          >
            {saving ? (
              <> <RefreshCw className="w-4 h-4 animate-spin text-cyan-500" /> Committing... </>
            ) : (
              <> <Save className="w-4 h-4" /> Inject Policy </>
            )}
          </button>
        </aside>

        {/* Editor Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed">
          <div className="absolute inset-0 bg-[#111116]/95 backdrop-blur-sm z-0"></div>

          <div className="relative z-10 flex flex-col h-full p-8 md:p-10">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{currentTypeLabel}</h2>
                <div className="text-[10px] text-cyan-500/80 font-mono tracking-[0.2em] uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded bg-cyan-500 animate-pulse"></span> Entity Scope: {target}
                </div>
              </div>
            </div>

            <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col cyber-editor-container">
              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-20 flex flex-col items-center justify-center">
                  <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                    <div className="absolute inset-0 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-r-2 border-indigo-500 animate-spin-reverse opacity-70"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 tracking-[0.3em] uppercase animate-pulse">Retrieving Node Data...</div>
                </div>
              )}

              <div className="flex-1 h-full editor-wrapper">
                <DefaultEditor
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      <style jsx global>{`
                .cyber-editor-container .rsw-editor {
                    background-color: transparent !important;
                    border: none !important;
                    min-height: 400px;
                    height: 100%;
                    color: #cbd5e1 !important; /* text-slate-300 */
                    font-family: inherit;
                    display: flex;
                    flex-direction: column;
                }

                .cyber-editor-container .rsw-toolbar {
                    background-color: rgba(255, 255, 255, 0.03) !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: #94a3b8 !important; /* text-slate-400 */
                    padding: 8px 12px;
                }

                .cyber-editor-container .rsw-btn {
                    color: #cbd5e1 !important;
                }

                .cyber-editor-container .rsw-btn:hover,
                .cyber-editor-container .rsw-btn[data-active="true"] {
                    background-color: rgba(34, 211, 238, 0.1) !important;
                    color: #22d3ee !important; /* text-cyan-400 */
                }

                .cyber-editor-container .rsw-ce {
                    padding: 24px !important;
                    outline: none !important;
                    flex: 1;
                    overflow-y: auto;
                }

                /* Editor Content Styling */
                .cyber-editor-container .rsw-ce h1,
                .cyber-editor-container .rsw-ce h2,
                .cyber-editor-container .rsw-ce h3 {
                    color: #f8fafc;
                    font-weight: 700;
                    margin-bottom: 1rem;
                }

                .cyber-editor-container .rsw-ce p {
                    margin-bottom: 1rem;
                    line-height: 1.6;
                }

                .cyber-editor-container .rsw-ce a {
                    color: #22d3ee;
                    text-decoration: underline;
                }

                /* Custom Scrollbar for editor */
                .cyber-editor-container .rsw-ce::-webkit-scrollbar {
                    width: 6px;
                }
                .cyber-editor-container .rsw-ce::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                .cyber-editor-container .rsw-ce::-webkit-scrollbar-thumb {
                    background: rgba(34, 211, 238, 0.2);
                    border-radius: 10px;
                }
                .cyber-editor-container .rsw-ce::-webkit-scrollbar-thumb:hover {
                    background: rgba(34, 211, 238, 0.4);
                }
            `}</style>
    </div>
  );
}
