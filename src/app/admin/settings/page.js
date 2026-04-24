'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/core/Api';
import { Settings as SettingsIcon, Mail, BellRing, Smartphone, Key, CreditCard, Bug, Database, ShieldCheck, Fingerprint, AppWindow, Save, CheckCircle, AlertTriangle, Eye, EyeOff, Cloud, Lock, X } from 'lucide-react';

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

const Input = ({ type = "text", placeholder, className = "", ...props }) => (<input type={type} className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-600 font-mono tracking-wide text-cyan-50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white/5 ${className}`} placeholder={placeholder} {...props} />);

const Button = ({ children, loading, type = "submit" }) => (<button type={type} disabled={loading} className={`mt-auto w-full flex items-center justify-center px-4 py-2.5 border rounded-lg text-xs font-mono font-bold tracking-widest uppercase transition-all ${loading ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border-indigo-500/30 hover:border-indigo-400/50 shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]'}`}>
    {loading ? (
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
            Syncing...
        </div>
    ) : (
        <div className="flex items-center gap-2">
            <Save className="w-3.5 h-3.5" /> {children}
        </div>
    )}
</button>
);

export default function SettingsPage() {
    const [toast, setToast] = useState(null);
    const toastTimeoutRef = useRef(null);

    const showToast = (message, type = 'success') => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToast({ message, type });
        toastTimeoutRef.current = setTimeout(() => setToast(null), 3000);
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

    const [syncingSection, setSyncingSection] = useState(null);
    const [fetching, setFetching] = useState(true);
    const [showSmtpPassword, setShowSmtpPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.password_confirmation) {
            return showToast("Authentication mismatch: New passwords do not match.", 'error');
        }
        setSyncingSection('CREDENTIALS');
        try {
            const data = await api.admin.profile.changePassword(passwordData);
            if (data.success) {
                showToast('Master access sequence updated successfully.');
                setPasswordData({ old_password: '', password: '', password_confirmation: '' });
            } else {
                showToast('Sequence rejected: ' + (data.error || data.message || "Unknown error"), 'error');
            }
        } catch (error) {
            showToast('Network failure during authentication update.', 'error');
        } finally {
            setSyncingSection(null);
        }
    };

    const fetchSettings = async () => {
        try {
            const data = await api.admin.settings.get();
            const settingData = data?.data;
            if (data.success && settingData) {
                const newFormData = { ...formData };
                Object.keys(newFormData).forEach(key => {
                    if (settingData[key] !== undefined && settingData[key] !== null) {
                        newFormData[key] = settingData[key];
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
            const dataToSync = {};
            keys.forEach(key => { dataToSync[key] = formData[key]; });

            const data = await api.admin.settings.update(dataToSync);
            if (data.success) {
                showToast(`${section} parameters synchronized with core matrix.`);
            } else {
                showToast(`Rejected: ${data.error}`, 'error');
            }
        } catch (error) {
            showToast(`Sync failure at ${section}.`, 'error');
        } finally {
            setSyncingSection(null);
        }
    };

    const sections = [
        {
            id: 'SMTP',
            title: 'SMTP Protocol (Email)',
            icon: Mail,
            keys: ['smtp_email', 'smtp_password', 'smtp_host', 'smtp_port', 'smtp_from_name', 'smtp_from_address'],
            fields: [
                { name: 'smtp_email', label: 'Auth Link (Email)', type: 'email', placeholder: 'root@domain.com' },
                { name: 'smtp_password', label: 'Auth Key (Password)', type: 'password', placeholder: '••••••••••••' },
                { name: 'smtp_host', label: 'Node Host', placeholder: 'smtp.domain.com' },
                { name: 'smtp_port', label: 'Node Port', placeholder: '587' },
                { name: 'smtp_from_name', label: 'Origin Alias (Name)', placeholder: 'System Core' },
                { name: 'smtp_from_address', label: 'Origin Routing', placeholder: 'no-reply@domain.com' },
            ]
        },
        {
            id: 'Notifications',
            title: 'Notifications Cluster',
            icon: BellRing,
            keys: ['push_notification_server_key'],
            fields: [
                { name: 'push_notification_server_key', label: 'PN Server Directive Key', type: 'textarea', placeholder: 'Enter raw server key payload...' }
            ]
        },
        {
            id: 'Cloud',
            title: 'Cloud Assets Grid',
            icon: Cloud,
            keys: ['cloudinary_url'],
            fields: [
                { name: 'cloudinary_url', label: 'Cloudinary Vector URL', type: 'password', placeholder: 'cloudinary://key:secret@name' }
            ]
        },
        {
            id: 'MSG91',
            title: 'Telecom Router (MSG91)',
            icon: Smartphone,
            keys: ['msg91_auth_key', 'msg91_template_id'],
            fields: [
                { name: 'msg91_auth_key', label: 'Access Token', placeholder: 'Authentication Hash' },
                { name: 'msg91_template_id', label: 'Format Signature', placeholder: 'Template ID String' }
            ]
        },
        {
            id: 'Razorpay',
            title: 'Financial Link (Razorpay)',
            icon: CreditCard,
            keys: ['razorpay_key_id', 'razorpay_key_secret'],
            fields: [
                { name: 'razorpay_key_id', label: 'Public Identifier', placeholder: 'rzp_live_...' },
                { name: 'razorpay_key_secret', label: 'Private Encrypt Key', type: 'password', placeholder: 'Secret Hash...' }
            ]
        },
        {
            id: 'Infrastructure',
            title: 'Data Infrastructure',
            icon: Database,
            keys: ['mongodb_uri', 'api_url'],
            fields: [
                { name: 'mongodb_uri', label: 'NoSQL Connection Vector', type: 'password', placeholder: 'mongodb+srv://...' },
                { name: 'api_url', label: 'API Gateway Locator', placeholder: 'https://api.domain.com' }
            ]
        },
        {
            id: 'Tokens',
            title: 'Authentication Tokens',
            icon: ShieldCheck,
            keys: ['jwt_secret'],
            fields: [
                { name: 'jwt_secret', label: 'JWT Cipher Secret', type: 'password', placeholder: 'Super Secret Hash' }
            ]
        },
        {
            id: 'AppleAuth',
            title: 'Apple Secure Auth',
            icon: Fingerprint,
            keys: ['apple_client_id', 'apple_team_id', 'apple_key_id', 'apple_private_key'],
            fields: [
                { name: 'apple_client_id', label: 'Client Interface ID', placeholder: 'Client ID' },
                { name: 'apple_team_id', label: 'Developer Team Identifier', placeholder: 'Team ID' },
                { name: 'apple_key_id', label: 'Cryptographic Key Identifier', placeholder: 'Key ID' },
                { name: 'apple_private_key', label: 'Raw Private Signature', type: 'textarea', placeholder: '-----BEGIN PRIVATE KEY-----...' }
            ]
        },
        {
            id: 'GoogleAuth',
            title: 'Google Mesh Auth',
            icon: Fingerprint,
            keys: ['google_client_id', 'google_client_secret'],
            fields: [
                { name: 'google_client_id', label: 'Client Interface ID', placeholder: 'Oauth Client ID' },
                { name: 'google_client_secret', label: 'Client Encrypted Secret', type: 'password', placeholder: 'Oauth Client Secret' }
            ]
        },
        {
            id: 'MetaAuth',
            title: 'Meta Graph Auth',
            icon: Fingerprint,
            keys: ['facebook_app_id', 'facebook_app_secret'],
            fields: [
                { name: 'facebook_app_id', label: 'Application Identifier', placeholder: 'Graph App ID' },
                { name: 'facebook_app_secret', label: 'Application Secret Hash', type: 'password', placeholder: 'Graph App Secret' }
            ]
        },
        {
            id: 'Secrets',
            title: 'System Core Secrets',
            icon: Lock,
            keys: ['social_pass', 'other_account_pass', 'master_otp'],
            fields: [
                { name: 'social_pass', label: 'Social Interface Pass', type: 'password', placeholder: 'Internal secret string' },
                { name: 'other_account_pass', label: 'Auxiliary Account Pass', type: 'password', placeholder: 'Secondary internal secret' },
                { name: 'master_otp', label: 'Review Master Bypass OTP', placeholder: '888888' }
            ]
        }
    ];

    const [passwordVisibilities, setPasswordVisibilities] = useState({});

    const toggleVisibility = (fieldName) => {
        setPasswordVisibilities(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
    };

    const renderField = (field, isPasswordData = false) => {
        const val = isPasswordData ? passwordData[field.name] : formData[field.name];
        const onChange = isPasswordData ? handlePasswordInputChange : handleChange;
        const isVisible = passwordVisibilities[field.name];

        if (field.type === 'textarea') {
            return (
                <FormGroup label={field.label} key={field.name}>
                    <textarea className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-600 font-mono tracking-wide text-cyan-50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white/5 h-24 resize-none cyber-scrollbar" placeholder={field.placeholder} name={field.name} value={val} onChange={onChange} ></textarea>
                </FormGroup>
            );
        }

        if (field.type === 'password' || field.showToggle) {
            return (
                <FormGroup label={field.label} key={field.name}>
                    <div className="relative">
                        <Input type={isVisible ? "text" : "password"} placeholder={field.placeholder} name={field.name} value={val} onChange={onChange} className={`pr-10 ${field.className || ''}`} required={field.required} />
                        <button type="button" onClick={() => toggleVisibility(field.name)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors">{isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                </FormGroup>
            );
        }

        return (
            <FormGroup label={field.label} key={field.name}>
                <Input type={field.type || "text"} placeholder={field.placeholder} name={field.name} value={val} onChange={onChange} required={field.required} />
            </FormGroup>
        );
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
        <div className="p-8 max-w-[1600px] mx-auto relative font-mono">

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-24 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-500 transform translate-x-0 opacity-100 animate-in slide-in-from-right-10 ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/10' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-500/10'}`}>
                    {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 animate-pulse" />}
                    <span className="text-sm font-mono font-bold tracking-wide">{toast.message}</span>
                    <button onClick={() => setToast(null)} className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                {/* Column 1: Communications & Cloud */}
                <div className="space-y-6">
                    {sections.filter(s => ['SMTP', 'Notifications', 'Cloud', 'MSG91'].includes(s.id)).map(section => (
                        <Card key={section.id} title={section.title} icon={section.icon}>
                            <form onSubmit={handleSubmit(section.id, section.keys)} className="flex flex-col">
                                {section.fields.map(field => renderField(field))}
                                <div className="mt-4"><Button loading={syncingSection === section.id}>Commit Config</Button></div>
                            </form>
                        </Card>
                    ))}
                </div>

                {/* Column 2: Security & Infrastructure */}
                <div className="space-y-6">
                    <Card title="System Overlord Credentials" icon={Key}>
                        <form onSubmit={handlePasswordSubmit} className="flex flex-col">
                            {renderField({ name: 'old_password', label: 'Current Sequence', showToggle: true, placeholder: '••••••••••••', required: true, className: 'border-rose-500/20 focus:border-rose-500/50 focus:ring-rose-500/20' }, true)}
                            {renderField({ name: 'password', label: 'New Matrix Sequence', showToggle: true, placeholder: '••••••••••••', required: true, className: 'border-emerald-500/20 focus:border-emerald-500/50 focus:ring-emerald-500/20' }, true)}
                            {renderField({ name: 'password_confirmation', label: 'Verify Sequence', showToggle: true, placeholder: '••••••••••••', required: true, className: 'border-emerald-500/20 focus:border-emerald-500/50 focus:ring-emerald-500/20' }, true)}
                            <div className="mt-4"><Button loading={syncingSection === 'CREDENTIALS'}>Execute Password Override</Button></div>
                        </form>
                    </Card>

                    {sections.filter(s => ['Razorpay', 'Infrastructure', 'Tokens'].includes(s.id)).map(section => (
                        <Card key={section.id} title={section.title} icon={section.icon}>
                            <form onSubmit={handleSubmit(section.id, section.keys)} className="flex flex-col">
                                {section.fields.map(field => renderField(field))}
                                <div className="mt-4"><Button loading={syncingSection === section.id}>Commit Config</Button></div>
                            </form>
                        </Card>
                    ))}
                </div>

                {/* Column 3: Social & Integrations */}
                <div className="space-y-6">
                    {sections.filter(s => ['AppleAuth', 'GoogleAuth', 'MetaAuth', 'Secrets'].includes(s.id)).map(section => (
                        <Card key={section.id} title={section.title} icon={section.icon}>
                            <form onSubmit={handleSubmit(section.id, section.keys)} className="flex flex-col">
                                {section.fields.map(field => renderField(field))}
                                <div className="mt-4"><Button loading={syncingSection === section.id}>Commit Config</Button></div>
                            </form>
                        </Card>
                    ))}
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
