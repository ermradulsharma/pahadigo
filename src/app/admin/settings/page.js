'use client';

import { useState, useEffect } from 'react';

// Helper components defined outside to avoid re-creation on render
const Card = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 last:mb-0">
        <div className="px-6 py-4 border-b border-gray-100">
            <h6 className="text-lg font-semibold text-gray-800">{title}</h6>
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

const FormGroup = ({ label, children }) => (
    <div className="mb-4 last:mb-0">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

const Input = ({ type = "text", placeholder, className = "", ...props }) => (
    <input
        type={type}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm ${className}`}
        placeholder={placeholder}
        {...props}
    />
);

const Button = ({ children, loading }) => (
    <button
        disabled={loading}
        className={`flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
    >
        {loading ? 'Submitting...' : children}
        {!loading && (
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
        )}
    </button>
);

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        smtp_email: '',
        smtp_password: '',
        smtp_host: '',
        smtp_port: '',
        smtp_from_address: '',
        smtp_from_name: '',
        push_notification_server_key: '',
        msg91_auth_key: '',
        msg91_template_id: '',
        razorpay_key_id: '',
        razorpay_key_secret: '',
        mongodb_uri: '',
        api_url: '',
        jwt_secret: '',
        google_client_id: '',
        google_client_secret: '',
        facebook_app_id: '',
        facebook_app_secret: '',
        apple_client_id: '',
        apple_team_id: '',
        apple_key_id: '',
        apple_private_key: '',
        app_name: '',
        terms_conditions: '',
        privacy_policy: '',
        rate_on_apple_store: '',
        rate_on_google_store: ''
    });

    const [showSmtpPassword, setShowSmtpPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.success && data.data) {
                // Determine fields to update to avoid overwriting with undefined if API returns partial data (though it shouldn't for this model)
                const newFormData = { ...formData };
                Object.keys(newFormData).forEach(key => {
                    if (data.data[key] !== undefined) {
                        newFormData[key] = data.data[key];
                    }
                });
                setFormData(newFormData);
            }
        } catch (error) {
        } finally {
            setFetching(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings: ' + data.error);
            }
        } catch (error) {
            alert('An error occurred while saving settings.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="p-6 flex justify-center items-center">Loading settings...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column 1 */}
                <div className="space-y-6">
                    {/* SMTP */}
                    <Card title="SMTP">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="Email:">
                                <Input type="email" placeholder="Email" name="smtp_email" value={formData.smtp_email} onChange={handleChange} />
                            </FormGroup>
                            <FormGroup label="Password:">
                                <div className="space-y-2">
                                    <Input
                                        type={showSmtpPassword ? "text" : "password"}
                                        placeholder="Password"
                                        name="smtp_password"
                                        value={formData.smtp_password}
                                        onChange={handleChange}
                                    />
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="show-smtp" checked={showSmtpPassword} onChange={() => setShowSmtpPassword(!showSmtpPassword)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                                        <label htmlFor="show-smtp" className="text-xs text-gray-600 cursor-pointer select-none">Show Password</label>
                                    </div>
                                </div>
                            </FormGroup>
                            <FormGroup label="Mail Host:"><Input placeholder="Mail Host" name="smtp_host" value={formData.smtp_host} onChange={handleChange} /></FormGroup>
                            <FormGroup label="Mail Port:"><Input placeholder="Mail Port" name="smtp_port" value={formData.smtp_port} onChange={handleChange} /></FormGroup>
                            <FormGroup label="From Address:"><Input placeholder="From Address" name="smtp_from_address" value={formData.smtp_from_address} onChange={handleChange} /></FormGroup>
                            <FormGroup label="From Name:"><Input placeholder="From Name" name="smtp_from_name" value={formData.smtp_from_name} onChange={handleChange} /></FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>

                    {/* Push Notification */}
                    <Card title="Push Notification Server Key">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="Server Key:">
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm h-32 resize-none"
                                    placeholder="Server Key"
                                    name="push_notification_server_key"
                                    value={formData.push_notification_server_key}
                                    onChange={handleChange}
                                ></textarea>
                            </FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>
                    {/* SMS Configuration */}
                    <Card title="SMS Configuration (MSG91)">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="MSG91 Auth Key:"><Input placeholder="MSG91 Auth Key" name="msg91_auth_key" value={formData.msg91_auth_key} onChange={handleChange} /></FormGroup>
                            <FormGroup label="MSG91 Template ID:"><Input placeholder="MSG91 Template ID" name="msg91_template_id" value={formData.msg91_template_id} onChange={handleChange} /></FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                    {/* Change Password - Keeping strictly visual or separate logic as it's user specific, not global setting */}
                    <Card title="Change Password">
                        <form onSubmit={(e) => { e.preventDefault(); alert("Password change functionality to be implemented separately."); }}>
                            <FormGroup label="Current Password:">
                                <div className="space-y-2">
                                    <Input
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="Current Password"
                                        name="old_password"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="show-current"
                                            checked={showCurrentPassword}
                                            onChange={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="show-current" className="text-xs text-gray-600 cursor-pointer select-none">Show Password</label>
                                    </div>
                                </div>
                            </FormGroup>
                            <FormGroup label="New Password:">
                                <div className="space-y-2">
                                    <Input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="New Password"
                                        name="password"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="show-new"
                                            checked={showNewPassword}
                                            onChange={() => setShowNewPassword(!showNewPassword)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="show-new" className="text-xs text-gray-600 cursor-pointer select-none">Show Password</label>
                                    </div>
                                </div>
                            </FormGroup>
                            <FormGroup label="Confirm Password:">
                                <div className="space-y-2">
                                    <Input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm Password"
                                        name="password_confirmation"
                                    />
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="show-confirm"
                                            checked={showConfirmPassword}
                                            onChange={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="show-confirm" className="text-xs text-gray-600 cursor-pointer select-none">Show Password</label>
                                    </div>
                                </div>
                            </FormGroup>
                            <Button>Submit</Button>
                        </form>
                    </Card>

                    {/* Razorpay Detail */}
                    <Card title="Razorpay Detail">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="Razorpay Key ID:">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                    </span>
                                    <Input className="pl-9" placeholder="Razorpay Key ID" name="razorpay_key_id" value={formData.razorpay_key_id} onChange={handleChange} />
                                </div>
                            </FormGroup>
                            <FormGroup label="Razorpay Key Secret:">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                    </span>
                                    <Input className="pl-9" placeholder="Razorpay Key Secret" name="razorpay_key_secret" value={formData.razorpay_key_secret} onChange={handleChange} />
                                </div>
                            </FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>

                    {/* Debug Mode */}
                    <Card title="Debug Mode">
                        <form onSubmit={(e) => { e.preventDefault(); alert("Debug mode toggle not yet linked to backend."); }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="debug_mode" id="debug_mode" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-indigo-600" />
                                    <label htmlFor="debug_mode" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                                </div>
                                <label htmlFor="debug_mode" className="text-sm font-medium text-gray-700">Debug Mode</label>
                            </div>
                            <Button>Submit</Button>
                            <style jsx>{`
                                .toggle-checkbox:checked {
                                    right: 0;
                                    border-color: #4f46e5;
                                }
                                .toggle-checkbox:checked + .toggle-label {
                                    background-color: #4f46e5;
                                }
                                /* basic positioning for toggle */
                                .toggle-checkbox {
                                    top: 0;
                                    left: 0;
                                    transition: all 0.2s cubic-bezier(0.5, 0.1, 0.2, 1);
                                }
                                .toggle-checkbox:checked {
                                    left: 1.5rem; /* calc(100% - 1.5rem) */
                                }
                            `}</style>
                        </form>
                    </Card>
                    {/* Database Configuration */}
                    <Card title="Database Configuration">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="MongoDB URI:"><Input placeholder="mongodb://localhost:27017/..." name="mongodb_uri" value={formData.mongodb_uri} onChange={handleChange} /></FormGroup>
                            <FormGroup label="API URL:"><Input placeholder="https://api.example.com" name="api_url" value={formData.api_url} onChange={handleChange} /></FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>

                    {/* JWT Configuration */}
                    <Card title="JWT Configuration">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="JWT Secret:"><Input placeholder="JWT Secret" name="jwt_secret" value={formData.jwt_secret} onChange={handleChange} /></FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>
                </div>

                {/* Column 3 */}
                <div className="space-y-6">
                    {/* Google Authentication */}
                    <Card title="Google Authentication">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="Client ID:"><Input placeholder="Google Client ID" name="google_client_id" value={formData.google_client_id} onChange={handleChange} /></FormGroup>
                            <FormGroup label="Client Secret:"><Input placeholder="Google Client Secret" name="google_client_secret" value={formData.google_client_secret} onChange={handleChange} /></FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>

                    {/* Facebook Authentication */}
                    <Card title="Facebook Authentication">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="App ID:"><Input placeholder="Facebook App ID" name="facebook_app_id" value={formData.facebook_app_id} onChange={handleChange} /></FormGroup>
                            <FormGroup label="App Secret:"><Input placeholder="Facebook App Secret" name="facebook_app_secret" value={formData.facebook_app_secret} onChange={handleChange} /></FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>

                    {/* Apple Authentication */}
                    <Card title="Apple Authentication">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="Client ID:"><Input placeholder="Apple Client ID" name="apple_client_id" value={formData.apple_client_id} onChange={handleChange} /></FormGroup>
                            <FormGroup label="Team ID:"><Input placeholder="Apple Team ID" name="apple_team_id" value={formData.apple_team_id} onChange={handleChange} /></FormGroup>
                            <FormGroup label="Key ID:"><Input placeholder="Apple Key ID" name="apple_key_id" value={formData.apple_key_id} onChange={handleChange} /></FormGroup>
                            <FormGroup label="Private Key:">
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm h-32 resize-none"
                                    placeholder="Apple Private Key"
                                    name="apple_private_key"
                                    value={formData.apple_private_key}
                                    onChange={handleChange}
                                ></textarea>
                            </FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>


                    {/* Application Details */}
                    <Card title="Application Details">
                        <form onSubmit={handleSubmit}>
                            <FormGroup label="APP Name:">
                                <Input placeholder="APP Name" name="app_name" value={formData.app_name} onChange={handleChange} />
                            </FormGroup>
                            <FormGroup label="Terms & Conditions:">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    </span>
                                    <Input className="pl-9" placeholder="Please enter link for terms & conditions" name="terms_conditions" value={formData.terms_conditions} onChange={handleChange} />
                                </div>
                            </FormGroup>
                            <FormGroup label="Privacy Policy:">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    </span>
                                    <Input className="pl-9" placeholder="Please enter link for privacy policy" name="privacy_policy" value={formData.privacy_policy} onChange={handleChange} />
                                </div>
                            </FormGroup>
                            <FormGroup label="Rate us on Apple Store:">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    </span>
                                    <Input className="pl-9" placeholder="Please enter app link for apple store" name="rate_on_apple_store" value={formData.rate_on_apple_store} onChange={handleChange} />
                                </div>
                            </FormGroup>
                            <FormGroup label="Rate us on Google Store:">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    </span>
                                    <Input className="pl-9" placeholder="Please enter app link for google store" name="rate_on_google_store" value={formData.rate_on_google_store} onChange={handleChange} />
                                </div>
                            </FormGroup>
                            <Button loading={loading}>Submit</Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
