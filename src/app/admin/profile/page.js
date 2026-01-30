"use client";
import { useState, useEffect } from 'react';
import { getToken } from '@/helpers/authUtils';

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

    // Effect to load states when profile is loaded and country is set
    useEffect(() => {
        if (formData.address.country && countries.length > 0) {
            const country = countries.find(c => c.name === formData.address.country);
            if (country) {
                fetchStates(country._id);
            }
        }
    }, [formData.address.country, countries]); // Be careful with dependency loop if formData updates causes re-fetch. 
    // Actually, formData updates on type. If we select country, it updates. Then this runs. 
    // Ideally we want to run this ONLY on initial load or explicit change logic is better handled in handler.
    // But initial load needs to hydrate states.
    // Let's use a separate effect for hydration or just call it in fetchProfile?
    // Profile fetch completes -> sets formData. countries fetch completes -> sets countries.
    // We can do it in a `useEffect` on `[formData.address.country]` but guard it?
    // Better: manual logic.

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
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();

            if (res.ok && data.success) {
                const user = data.data.user;
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
                setMessage({ type: 'error', text: 'Failed to fetch profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred fetching profile' });
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
                expertise: formData.expertise.split(',').map(item => item.trim()).filter(item => item !== '')
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
                setMessage({ type: 'success', text: 'Profile updated successfully' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
            </div>

            {message.text && (
                <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* Personal Details */}
                        <div className="md:col-span-3">
                            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Personal Details</h2>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                            <input type="email" value={formData.email} disabled className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-500 bg-gray-100 leading-tight cursor-not-allowed" />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed directly.</p>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Date of Birth</label>
                            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Designation</label>
                            <input type="text" name="designation" value={formData.designation} onChange={handleChange} placeholder="e.g. Administrator" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Website</label>
                            <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div className="md:col-span-3">
                            <label className="block text-gray-700 text-sm font-bold mb-2">Bio</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" placeholder="Tell us about yourself..." className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                            <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
                        </div>

                        {/* Professional & Social */}
                        <div className="md:col-span-3 mt-4">
                            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Professional & Social</h2>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Expertise</label>
                            <input type="text" name="expertise" value={formData.expertise} onChange={handleChange} placeholder="e.g. Travel Planning, Customer Service (comma separated)" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">LinkedIn</label>
                            <input type="url" name="socialLinks.linkedin" value={formData.socialLinks.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Twitter</label>
                            <input type="url" name="socialLinks.twitter" value={formData.socialLinks.twitter} onChange={handleChange} placeholder="https://twitter.com/username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Instagram</label>
                            <input type="url" name="socialLinks.instagram" value={formData.socialLinks.instagram} onChange={handleChange} placeholder="https://instagram.com/username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">GitHub</label>
                            <input type="url" name="socialLinks.github" value={formData.socialLinks.github} onChange={handleChange} placeholder="https://github.com/username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        {/* Emergency Contact */}
                        <div className="md:col-span-3 mt-4">
                            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Emergency Contact</h2>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Contact Name</label>
                            <input type="text" name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Contact Phone</label>
                            <input type="text" name="emergencyContact.phone" value={formData.emergencyContact.phone} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Relationship</label>
                            <input type="text" name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={handleChange} placeholder="e.g. Spouse, Parent" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        {/* Address Details */}
                        <div className="md:col-span-3 mt-4">
                            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Address</h2>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Address Line 1</label>
                            <input type="text" name="address.line1" value={formData.address.line1} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">City</label>
                            <input type="text" name="address.city" value={formData.address.city} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Country</label>
                            <select name="address.country" value={formData.address.country} onChange={handleCountryChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                <option value="">Select Country</option>
                                {countries.map(c => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">State</label>
                            <select name="address.state" value={formData.address.state} onChange={handleChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                <option value="">Select State</option>
                                {states.map(s => (
                                    <option key={s._id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Pincode</label>
                            <input type="text" name="address.pincode" value={formData.address.pincode} onChange={handleChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>

                        {/* Preferences */}
                        <div className="md:col-span-3 mt-4">
                            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Preferences</h2>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Language</label>
                            <select name="preferences.language" value={formData.preferences.language} onChange={handleChange} className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                <option value="en">English</option>
                                <option value="hi">Hindi</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                            </select>
                        </div>

                        <div className="md:col-span-2 flex flex-wrap gap-6 items-center pt-6">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" name="preferences.notifications.email" checked={formData.preferences.notifications.email} onChange={handleChange} className="form-checkbox h-5 w-5 text-indigo-600" />
                                <span className="text-gray-700 font-medium">Email Notifications</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" name="preferences.notifications.sms" checked={formData.preferences.notifications.sms} onChange={handleChange} className="form-checkbox h-5 w-5 text-indigo-600" />
                                <span className="text-gray-700 font-medium">SMS Notifications</span>
                            </label>

                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" name="preferences.notifications.push" checked={formData.preferences.notifications.push} onChange={handleChange} className="form-checkbox h-5 w-5 text-indigo-600" />
                                <span className="text-gray-700 font-medium">Push Notifications</span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button type="submit" disabled={saving} className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-150 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}> {saving ? 'Saving...' : 'Save Changes'} </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
