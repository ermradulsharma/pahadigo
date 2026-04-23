'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/core/Helpers/authUtils';
import { Settings as SettingsIcon, Mail, BellRing, Smartphone, Key, CreditCard, Bug, Database, ShieldCheck, Fingerprint, AppWindow, Save, CheckCircle, AlertTriangle, Eye, EyeOff, Cloud, Lock } from 'lucide-react';

const Card = ({ title, icon: Icon, children }) => (
  <div className="bg-[#111116] rounded-xl border border-white/10 relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col">
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none transition-opacity group-hover:opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }}></div>
    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 group-hover:via-cyan-400 to-transparent transition-all"></div>

    <div className="px-5 py-4 border-b border-white/10 bg-black/40 flex items-center gap-3 relative z-10 shrink-0">
      <div className="p-1.5 bg-white/5 rounded border border-white/5 shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]">
        <Icon className="w-4 h-4 text-cyan-400" />
      </div>
      <h6 className="text-[11px] font-mono font-bold text-white tracking-widest uppercase">{title}</h6>
    </div>
    <div className="p-5 relative z-10 flex-1 flex flex-col">
      {children}
    </div>
  </div>
);

const FormGroup = ({ label, children }) => (
  <div className="mb-4 last:mb-0">
    <label className="block text-[10px] font-mono tracking-widest text-indigo-300 uppercase mb-2">{label}</label>
    {children}
  </div>
);

const Input = ({ type = "text", placeholder, className = "", ...props }) => (
  <input
    type={type}
    className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-600 font-mono tracking-wide text-cyan-50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white/5 ${className}`}
    placeholder={placeholder}
    {...props}
  />
);

const Button = ({ children, loading, type = "submit" }) => (
  <button
    type={type}
    disabled={loading}
    className={`mt-auto w-full flex items-center justify-center px-4 py-2.5 border rounded-lg text-xs font-mono font-bold tracking-widest uppercase transition-all
            ${loading
        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
        : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border-indigo-500/30 hover:border-indigo-400/50 shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]'
      }`}
  >
    {loading ? (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
        Syncing...
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <Save className="w-3.5 h-3.5" />
        {children}
      </div>
    )}
  </button>
);

export default function SettingsPage() {
  const [syncingSection, setSyncingSection] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const showMessage = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const [formData, setFormData] = useState({
    smtp_email: '', smtp_password: '', smtp_host: '', smtp_port: '', smtp_from_address: '', smtp_from_name: '',
    push_notification_server_key: '', msg91_auth_key: '', msg91_template_id: '', razorpay_key_id: '',
    razorpay_key_secret: '', mongodb_uri: '', api_url: '', jwt_secret: '', google_client_id: '',
    google_client_secret: '', facebook_app_id: '', facebook_app_secret: '', apple_client_id: '',
    apple_team_id: '', apple_key_id: '', apple_private_key: '', app_name: '', terms_conditions: '',
    privacy_policy: '', rate_on_apple_store: '', rate_on_google_store: '', cloudinary_url: '',
    social_pass: '', other_account_pass: '', master_otp: '', debug_mode: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    password: '',
    password_confirmation: ''
  });

  const handlePasswordInputChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
      return showMessage('error', "Authentication mismatch: New passwords do not match.");
    }
    setPasswordLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', 'Master access sequence updated successfully.');
        setPasswordData({ old_password: '', password: '', password_confirmation: '' });
      } else {
        showMessage('error', 'Sequence rejected: ' + (data.error || data.message || "Unknown error"));
      }
    } catch (error) {
      showMessage('error', 'Network failure during authentication update.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const newFormData = { ...formData };
        Object.keys(newFormData).forEach(key => {
          if (data.data[key] !== undefined && data.data[key] !== null) {
            newFormData[key] = data.data[key];
          }
        });
        setFormData(newFormData);
      }
    } catch (error) {
      console.error("[Settings] Fetch failed:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (section, keys) => async (e) => {
    e.preventDefault();
    setSyncingSection(section);
    try {
      const token = getToken();
      const dataToSync = {};
      keys.forEach(key => { dataToSync[key] = formData[key]; });

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(dataToSync)
      });
      const data = await res.json();
      if (data.success) {
        showMessage('success', `${section} parameters synchronized with core matrix.`);
      } else {
        showMessage('error', `Rejected: ${data.error}`);
      }
    } catch (error) {
      showMessage('error', `Sync failure at ${section}.`);
    } finally {
      setSyncingSection(null);
    }
  };

  if (fetching) {
    return (
      <div className="p-8 h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-t-2 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-r-2 border-cyan-500 animate-spin-reverse opacity-70"></div>
          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
        </div>
        <div className="text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase animate-pulse">Initializing Setup Matrix...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto pb-24 relative font-mono">

      {statusMessage && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-top-5 duration-300">
          <div className={`p-4 rounded-lg border flex items-center gap-3 text-sm tracking-wide shadow-2xl backdrop-blur-md
                        ${statusMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10'}`}>
            {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 animate-pulse" />}
            {statusMessage.text}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 border-b border-white/10 pb-6 text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 uppercase">
            <SettingsIcon className="w-7 h-7 text-indigo-400 opacity-80" /> Global Environment
          </h1>
          <p className="text-xs text-slate-500 tracking-widest uppercase mt-2">Manage System Variables & API Integration Nodes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Column 1 - Comms */}
        <div className="space-y-6 flex flex-col">
          <Card title="SMTP Protocol (Email)" icon={Mail}>
            <form onSubmit={handleSubmit('SMTP', ['smtp_email', 'smtp_password', 'smtp_host', 'smtp_port', 'smtp_from_name', 'smtp_from_address'])} className="flex flex-col h-full">
              <FormGroup label="Auth Link (Email)"><Input type="email" placeholder="root@domain.com" name="smtp_email" value={formData.smtp_email} onChange={handleChange} /></FormGroup>
              <FormGroup label="Auth Key (Password)">
                <div className="relative">
                  <Input type={showSmtpPassword ? "text" : "password"} placeholder="••••••••••••" name="smtp_password" value={formData.smtp_password} onChange={handleChange} className="pr-10" />
                  <button type="button" onClick={() => setShowSmtpPassword(!showSmtpPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors">
                    {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormGroup>
              <FormGroup label="Node Host"><Input placeholder="smtp.domain.com" name="smtp_host" value={formData.smtp_host} onChange={handleChange} /></FormGroup>
              <FormGroup label="Node Port"><Input placeholder="587" name="smtp_port" value={formData.smtp_port} onChange={handleChange} /></FormGroup>
              <FormGroup label="Origin Alias (Name)"><Input placeholder="System Core" name="smtp_from_name" value={formData.smtp_from_name} onChange={handleChange} /></FormGroup>
              <FormGroup label="Origin Routing"><Input placeholder="no-reply@domain.com" name="smtp_from_address" value={formData.smtp_from_address} onChange={handleChange} /></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'SMTP'}>Commit Config</Button></div>
            </form>
          </Card>

          <Card title="Notifications Cluster" icon={BellRing}>
            <form onSubmit={handleSubmit('Notifications', ['push_notification_server_key'])} className="flex flex-col h-full">
              <FormGroup label="PN Server Directive Key"><textarea className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-600 font-mono tracking-wide text-cyan-50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white/5 h-24 resize-none cyber-scrollbar" placeholder="Enter raw server key payload..." name="push_notification_server_key" value={formData.push_notification_server_key} onChange={handleChange}></textarea></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'Notifications'}>Commit Config</Button></div>
            </form>
          </Card>

          <Card title="Cloud Assets Grid" icon={Cloud}>
            <form onSubmit={handleSubmit('Cloud', ['cloudinary_url'])} className="flex flex-col h-full">
              <FormGroup label="Cloudinary Vector URL"><Input placeholder="cloudinary://key:secret@name" name="cloudinary_url" type="password" value={formData.cloudinary_url} onChange={handleChange} /></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'Cloud'}>Commit Config</Button></div>
            </form>
          </Card>

          <Card title="Telecom Router (MSG91)" icon={Smartphone}>
            <form onSubmit={handleSubmit('MSG91', ['msg91_auth_key', 'msg91_template_id'])} className="flex flex-col h-full">
              <FormGroup label="Access Token"><Input placeholder="Authentication Hash" name="msg91_auth_key" value={formData.msg91_auth_key} onChange={handleChange} /></FormGroup>
              <FormGroup label="Format Signature"><Input placeholder="Template ID String" name="msg91_template_id" value={formData.msg91_template_id} onChange={handleChange} /></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'MSG91'}>Commit Config</Button></div>
            </form>
          </Card>
        </div>

        {/* Column 2 - Core Assets */}
        <div className="space-y-6 flex flex-col">
          <Card title="System Overlord Credentials" icon={Key}>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col h-full">
              <FormGroup label="Current Sequence">
                <div className="relative">
                  <Input type={showCurrentPassword ? "text" : "password"} placeholder="••••••••••••" name="old_password" value={passwordData.old_password} onChange={handlePasswordInputChange} required className="pr-10 border-rose-500/20 focus:border-rose-500/50 focus:ring-rose-500/20" />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormGroup>
              <FormGroup label="New Matrix Sequence">
                <div className="relative">
                  <Input type={showNewPassword ? "text" : "password"} placeholder="••••••••••••" name="password" value={passwordData.password} onChange={handlePasswordInputChange} required className="pr-10 border-emerald-500/20 focus:border-emerald-500/50 focus:ring-emerald-500/20" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormGroup>
              <FormGroup label="Verify Sequence">
                <div className="relative">
                  <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••••••" name="password_confirmation" value={passwordData.password_confirmation} onChange={handlePasswordInputChange} required className="pr-10 border-emerald-500/20 focus:border-emerald-500/50 focus:ring-emerald-500/20" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </FormGroup>
              <div className="mt-4"><Button loading={passwordLoading}>Execute Password Override</Button></div>
            </form>
          </Card>

          <Card title="Financial Link (Razorpay)" icon={CreditCard}>
            <form onSubmit={handleSubmit('Razorpay', ['razorpay_key_id', 'razorpay_key_secret'])} className="flex flex-col h-full">
              <FormGroup label="Public Identifier"><Input placeholder="rzp_live_..." name="razorpay_key_id" value={formData.razorpay_key_id} onChange={handleChange} /></FormGroup>
              <FormGroup label="Private Encrypt Key"><Input placeholder="Secret Hash..." name="razorpay_key_secret" type="password" value={formData.razorpay_key_secret} onChange={handleChange} /></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'Razorpay'}>Commit Config</Button></div>
            </form>
          </Card>

          <Card title="Data Infrastructure" icon={Database}>
            <form onSubmit={handleSubmit('Infrastructure', ['mongodb_uri', 'api_url'])} className="flex flex-col h-full">
              <FormGroup label="NoSQL Connection Vector"><Input placeholder="mongodb+srv://..." name="mongodb_uri" type="password" value={formData.mongodb_uri} onChange={handleChange} /></FormGroup>
              <FormGroup label="API Gateway Locator"><Input placeholder="https://api.domain.com" name="api_url" value={formData.api_url} onChange={handleChange} /></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'Infrastructure'}>Commit Config</Button></div>
            </form>
          </Card>

          <Card title="Authentication Tokens" icon={ShieldCheck}>
            <form onSubmit={handleSubmit('Tokens', ['jwt_secret'])} className="flex flex-col h-full">
              <FormGroup label="JWT Cipher Secret"><Input placeholder="Super Secret Hash" name="jwt_secret" type="password" value={formData.jwt_secret} onChange={handleChange} /></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'Tokens'}>Commit Config</Button></div>
            </form>
          </Card>
        </div>

        {/* Column 3 - Integrations */}
        <div className="space-y-6 flex flex-col">
          <Card title="Apple Secure Auth" icon={Fingerprint}>
            <form onSubmit={handleSubmit('AppleAuth', ['apple_client_id', 'apple_team_id', 'apple_key_id', 'apple_private_key'])} className="flex flex-col h-full">
              <FormGroup label="Client Interface ID"><Input placeholder="Client ID" name="apple_client_id" value={formData.apple_client_id} onChange={handleChange} /></FormGroup>
              <FormGroup label="Developer Team Identifier"><Input placeholder="Team ID" name="apple_team_id" value={formData.apple_team_id} onChange={handleChange} /></FormGroup>
              <FormGroup label="Cryptographic Key Identifier"><Input placeholder="Key ID" name="apple_key_id" value={formData.apple_key_id} onChange={handleChange} /></FormGroup>
              <FormGroup label="Raw Private Signature"><textarea className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-600 font-mono tracking-wide text-cyan-50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white/5 h-20 resize-none cyber-scrollbar" placeholder="-----BEGIN PRIVATE KEY-----..." name="apple_private_key" value={formData.apple_private_key} onChange={handleChange}></textarea></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'AppleAuth'}>Commit Config</Button></div>
            </form>
          </Card>

          <Card title="Google Mesh Auth" icon={Fingerprint}>
            <form onSubmit={handleSubmit('GoogleAuth', ['google_client_id', 'google_client_secret'])} className="flex flex-col h-full">
              <FormGroup label="Client Interface ID"><Input placeholder="Oauth Client ID" name="google_client_id" value={formData.google_client_id} onChange={handleChange} /></FormGroup>
              <FormGroup label="Client Encrypted Secret"><Input placeholder="Oauth Client Secret" type="password" name="google_client_secret" value={formData.google_client_secret} onChange={handleChange} /></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'GoogleAuth'}>Commit Config</Button></div>
            </form>
          </Card>

          <Card title="Meta Graph Auth" icon={Fingerprint}>
            <form onSubmit={handleSubmit('MetaAuth', ['facebook_app_id', 'facebook_app_secret'])} className="flex flex-col h-full">
              <FormGroup label="Application Identifier"><Input placeholder="Graph App ID" name="facebook_app_id" value={formData.facebook_app_id} onChange={handleChange} /></FormGroup>
              <FormGroup label="Application Secret Hash"><Input placeholder="Graph App Secret" type="password" name="facebook_app_secret" value={formData.facebook_app_secret} onChange={handleChange} /></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'MetaAuth'}>Commit Config</Button></div>
            </form>
          </Card>

          <Card title="System Core Secrets" icon={Lock}>
            <form onSubmit={handleSubmit('Secrets', ['social_pass', 'other_account_pass', 'master_otp'])} className="flex flex-col h-full">
              <FormGroup label="Social Interface Pass"><Input placeholder="Internal secret string" name="social_pass" type="password" value={formData.social_pass} onChange={handleChange} /></FormGroup>
              <FormGroup label="Auxiliary Account Pass"><Input placeholder="Secondary internal secret" name="other_account_pass" type="password" value={formData.other_account_pass} onChange={handleChange} /></FormGroup>
              <FormGroup label="Review Master Bypass OTP"><Input placeholder="888888" name="master_otp" value={formData.master_otp} onChange={handleChange} /></FormGroup>
              <div className="mt-4"><Button loading={syncingSection === 'Secrets'}>Commit Config</Button></div>
            </form>
          </Card>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
                .cyber-scrollbar::-webkit-scrollbar { width: 6px; }
                .cyber-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); }
                .cyber-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 10px; }
                .cyber-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.4); }
            `}} />
    </div>
  );
}
