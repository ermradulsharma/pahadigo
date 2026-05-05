"use client";
import { useState, useEffect } from 'react';
import { getToken } from '@/core/Helpers/authUtils';
import { User, Mail, Phone, MapPin, Shield, Camera, Save, CheckCircle, AlertTriangle, Lock, Eye, EyeOff, Briefcase, Globe, Hash, Terminal, Settings, HardDrive } from 'lucide-react';
import Loading from '@/components/admin/Loading';

export default function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    designation: '',
    bio: '',
    website: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      instagram: '',
      github: ''
    },
    expertise: '', // Will handle as comma-separated string in UI
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    address: {
      line1: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    },
    preferences: {
      language: 'en',
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    }
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchCountries();
  }, []);

  useEffect(() => {
    if (formData.address.country && countries.length > 0) {
      const country = countries.find(c => c.name === formData.address.country);
      if (country) {
        fetchStates(country._id);
      }
    }
  }, [formData.address.country, countries]);

  const fetchCountries = async () => {
    try {
      const res = await fetch('/api/countries?limit=all');
      const data = await res.json();
      if (data.success) {
        setCountries(data.data.countries || []);
      }
    } catch (error) {
      console.error("Error fetching countries", error);
    }
  };

  const fetchStates = async (countryId) => {
    try {
      const res = await fetch(`/api/countries/${countryId}/states?limit=all`);
      const data = await res.json();
      if (data.success) {
        setStates(data.data.states || []);
      }
    } catch (error) {
      console.error("Error fetching states", error);
    }
  };

  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, country: countryName, state: '' }
    }));

    const country = countries.find(c => c.name === countryName);
    if (country) {
      fetchStates(country._id);
    } else {
      setStates([]);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/admin/profile', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const user = data.data;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          gender: user.gender || '',
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
          designation: user.designation || '',
          bio: user.bio || '',
          website: user.website || '',
          socialLinks: {
            linkedin: user.socialLinks?.linkedin || '',
            twitter: user.socialLinks?.twitter || '',
            instagram: user.socialLinks?.instagram || '',
            github: user.socialLinks?.github || ''
          },
          expertise: Array.isArray(user.expertise) ? user.expertise.join(', ') : '',
          emergencyContact: {
            name: user.emergencyContact?.name || '',
            phone: user.emergencyContact?.phone || '',
            relationship: user.emergencyContact?.relationship || ''
          },
          address: {
            line1: user.address?.line1 || '',
            city: user.address?.city || '',
            state: user.address?.state || '',
            country: user.address?.country || '',
            pincode: user.address?.pincode || ''
          },
          preferences: {
            language: user.preferences?.language || 'en',
            notifications: {
              email: user.preferences?.notifications?.email ?? true,
              sms: user.preferences?.notifications?.sms ?? true,
              push: user.preferences?.notifications?.push ?? true
            }
          }
        });
      } else {
        setMessage({ type: 'error', text: 'Failed to access profile core' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Connection vector failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      if (!name.includes('.')) {
        return { ...prev, [name]: val };
      }

      const keys = name.split('.');
      const newFormData = { ...prev };
      let current = newFormData;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = val;
      return newFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getToken();
      const payload = {
        ...formData,
        expertise: formData.expertise ? formData.expertise.split(',').map(item => item.trim()).filter(item => item !== '') : []
      };
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Identity parameters merged and validated.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Identity overwrite rejected.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Communication fault during save sequence.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading message="Establishing Neural Link..." />;

  const InputLabel = ({ children }) => (
    <label className="block text-[10px] font-mono tracking-widest text-cyan-500/80 uppercase mb-2">
      {children}
    </label>
  );

  const TextInput = ({ name, value, type = 'text', placeholder, disabled, onChange }) => (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none transition-all placeholder:text-slate-600 font-mono tracking-wide
                ${disabled ? 'text-slate-500 cursor-not-allowed border-white/5 opacity-70' : 'text-cyan-50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white/5'}`}
    />
  );

  const SelectInput = ({ name, value, onChange, options, defaultOption }) => (
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none transition-all text-cyan-50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white/5 font-mono tracking-wide appearance-none cursor-pointer"
    >
      <option value="" className="bg-[#111116]">{defaultOption}</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.value} className="bg-[#111116]">{opt.label}</option>
      ))}
    </select>
  );

  const FormSection = ({ title, icon: Icon, children }) => (
    <div className="mb-10 relative">
      <div className="flex items-center gap-3 mb-6 pb-3 border-b border-white/10">
        <div className="p-2 bg-white/5 rounded-lg border border-white/5 shadow-[inset_0_0_10px_rgba(255,255,255,0.02)]">
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <h2 className="text-md font-bold text-white tracking-widest uppercase">{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        {children}
      </div>
    </div>
  );

  return (
    <div className="p-6 mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 border-b border-white/10 pb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <User className="w-7 h-7 text-indigo-400 opacity-80" /> Operator Identity
          </h1>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mt-2">Manage System Authorization Credentials & Metadata</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 mb-8 rounded-lg border flex items-center gap-3 text-sm font-mono tracking-wide shadow-lg
                    ${message.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'
            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/10'}`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 animate-pulse" />}
          {message.text}
        </div>
      )}

      <div className="bg-[#111116] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] bg-[length:20px_20px] bg-fixed opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>

        <form onSubmit={handleSubmit} className="p-8 md:p-10 relative z-10 w-full">

          <FormSection title="Core Subroutine Information" icon={Terminal}>
            <div>
              <InputLabel>Designated Alias</InputLabel>
              <TextInput name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div>
              <InputLabel>System Comm Link (Email)</InputLabel>
              <TextInput value={formData.email} disabled={true} />
              <p className="text-[9px] text-slate-500 mt-2 font-mono uppercase tracking-widest">Core identifier locked by system architect.</p>
            </div>
            <div>
              <InputLabel>Carrier Frequency (Phone)</InputLabel>
              <TextInput name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div>
              <InputLabel>Biological Specifier</InputLabel>
              <SelectInput
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                defaultOption="Select Class"
                options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]}
              />
            </div>
            <div>
              <InputLabel>Initialization Date</InputLabel>
              <TextInput type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
            </div>
            <div>
              <InputLabel>Access Level Designation</InputLabel>
              <TextInput name="designation" placeholder="e.g. System Overlord" value={formData.designation} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <InputLabel>Identity Log / Bio</InputLabel>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
                placeholder="Describe operator history..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm outline-none transition-all placeholder:text-slate-600 font-mono tracking-wide text-cyan-50 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white/5 resize-none cyber-scrollbar"
              ></textarea>
              <p className="text-[10px] text-cyan-500/50 mt-1.5 font-mono text-right">{formData.bio.length}/500 bytes</p>
            </div>
          </FormSection>

          <FormSection title="Network Vectors & External Links" icon={Globe}>
            <div>
              <InputLabel>Specialized Vectors (Expertise)</InputLabel>
              <TextInput name="expertise" value={formData.expertise} onChange={handleChange} placeholder="Comma delimited array..." />
            </div>
            <div>
              <InputLabel>Domain Name (Website)</InputLabel>
              <TextInput name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://..." />
            </div>
            <div>
              <InputLabel>Node: LinkedIn</InputLabel>
              <TextInput name="socialLinks.linkedin" type="url" value={formData.socialLinks.linkedin} onChange={handleChange} placeholder="URI reference" />
            </div>
            <div>
              <InputLabel>Node: Twitter</InputLabel>
              <TextInput name="socialLinks.twitter" type="url" value={formData.socialLinks.twitter} onChange={handleChange} placeholder="URI reference" />
            </div>
            <div>
              <InputLabel>Node: Instagram</InputLabel>
              <TextInput name="socialLinks.instagram" type="url" value={formData.socialLinks.instagram} onChange={handleChange} placeholder="URI reference" />
            </div>
            <div>
              <InputLabel>Node: GitHub</InputLabel>
              <TextInput name="socialLinks.github" type="url" value={formData.socialLinks.github} onChange={handleChange} placeholder="URI reference" />
            </div>
          </FormSection>

          <FormSection title="Emergency Protocol Routing" icon={Shield}>
            <div>
              <InputLabel>Directive Target (Name)</InputLabel>
              <TextInput name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} />
            </div>
            <div>
              <InputLabel>Target Comms (Phone)</InputLabel>
              <TextInput name="emergencyContact.phone" value={formData.emergencyContact.phone} onChange={handleChange} />
            </div>
            <div>
              <InputLabel>Target Relational Mesh (Relationship)</InputLabel>
              <TextInput name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={handleChange} placeholder="e.g. Commander, Sibling" />
            </div>
          </FormSection>

          <FormSection title="Geographical Coordinates" icon={MapPin}>
            <div>
              <InputLabel>Coordinate Line 1</InputLabel>
              <TextInput name="address.line1" value={formData.address.line1} onChange={handleChange} />
            </div>
            <div>
              <InputLabel>Sector (City)</InputLabel>
              <TextInput name="address.city" value={formData.address.city} onChange={handleChange} />
            </div>
            <div>
              <InputLabel>Macro-region (Country)</InputLabel>
              <SelectInput
                name="address.country"
                value={formData.address.country}
                onChange={handleCountryChange}
                defaultOption="Query Available Regions"
                options={countries.map(c => ({ value: c.name, label: c.name }))}
              />
            </div>
            <div>
              <InputLabel>Sub-region (State)</InputLabel>
              <SelectInput
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
                defaultOption="Query Sub-Regions"
                options={states.map(s => ({ value: s.name, label: s.name }))}
              />
            </div>
            <div>
              <InputLabel>Area Hash (Pincode)</InputLabel>
              <TextInput name="address.pincode" value={formData.address.pincode} onChange={handleChange} />
            </div>
          </FormSection>

          <FormSection title="System Overrides & Preferences" icon={Settings}>
            <div>
              <InputLabel>Syntax Parser (Language)</InputLabel>
              <SelectInput
                name="preferences.language"
                value={formData.preferences.language}
                onChange={handleChange}
                defaultOption=""
                options={[
                  { value: 'en', label: 'English (EN-US)' },
                  { value: 'hi', label: 'Hindi (HI-IN)' },
                  { value: 'fr', label: 'French (FR-EU)' },
                  { value: 'de', label: 'German (DE-EU)' }
                ]}
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-white/5 mt-2">
              <InputLabel>Alert Vector Channels</InputLabel>
              <div className="flex flex-wrap gap-8 mt-4">
                {['email', 'sms', 'push'].map((type) => (
                  <label key={type} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded border border-white/20 bg-black/50 group-hover:border-indigo-400 transition-colors">
                      <input
                        type="checkbox"
                        name={`preferences.notifications.${type}`}
                        checked={formData.preferences.notifications[type]}
                        onChange={handleChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {formData.preferences.notifications[type] && (
                        <div className="w-2.5 h-2.5 bg-indigo-400 rounded-sm shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                      )}
                    </div>
                    <span className="text-xs font-mono uppercase tracking-widest text-slate-400 group-hover:text-indigo-300 transition-colors">
                      {type} Transmissions
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </FormSection>

          <div className="mt-12 flex justify-end shrink-0">
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-3 rounded-xl text-xs font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-3 transition-all border
                                ${saving
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                  : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 border-indigo-500/30 hover:border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]'
                }`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                  Merging...
                </>
              ) : (
                <>
                  <HardDrive className="w-4 h-4" /> Save Identity Configuration
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
                .cyber-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .cyber-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.2);
                }
                .cyber-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(34, 211, 238, 0.2);
                    border-radius: 10px;
                }
                .cyber-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(34, 211, 238, 0.4);
                }
                input[type="date"]::-webkit-calendar-picker-indicator {
                    filter: invert(0.8) sepia(1) saturate(5) hue-rotate(180deg);
                    cursor: pointer;
                }
            `}} />
    </div>
  );
}
