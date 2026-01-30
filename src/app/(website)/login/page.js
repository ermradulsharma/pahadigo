'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { setToken } from '@/helpers/authUtils';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe })
            });

            const response = await res.json();

            if (res.ok) {
                const data = response.data || response;

                // Use helper to set token based on rememberMe preference
                setToken(data.token, data.role, rememberMe);

                if (data.role === 'admin') {
                    router.push('/admin');
                } else {
                    setError('Access restricted to Admins only');
                    // Clear tokens if access denied
                    setToken(null, null, false); // effectively removes both due to logic, or call removeToken
                    localStorage.removeItem('token'); // Safer manual clear ensuring clean state
                    localStorage.removeItem('role');
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('role');
                }
            } else {
                setError(response.message || response.error || 'Login failed');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forget-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const response = await res.json();
            if (res.ok) {
                setMessage('If an account exists, a reset link has been sent.');
            } else {
                setError(response.message || 'Request failed');
            }
        } catch (err) {
            setError('Network error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative">
            {/* Background Image */}
            <Image src="/img/background.png" alt="Himalayas Background" fill className="object-cover" priority />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30" />

            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <h2 className="text-center text-3xl font-extrabold text-white">PahadiGo</h2>
                <p className="text-center text-sm text-gray-200 mt-2 mb-2">{isForgotPassword ? 'Reset Your Password' : 'Login Your Account'}</p>
            </div>
            <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="bg-white/95 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-white/20">
                    {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded text-sm">{error}</div>}
                    {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-600 p-3 rounded text-sm">{message}</div>}
                    {!isForgotPassword ? (
                        <form className="space-y-6" onSubmit={handleLogin}>
                            <div className='mb-2'>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                <div className="mt-1">
                                    <input required value={email} onChange={e => setEmail(e.target.value)} type="email" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                            </div>

                            <div className='mb-2'>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <div className="mt-1">
                                    <input required value={password} onChange={e => setPassword(e.target.value)} type="password" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-3 mt-3">
                                <div className="flex items-center">
                                    <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900"> Remember me </label>
                                </div>
                                <div className="text-sm">
                                    <button type="button" onClick={() => setIsForgotPassword(true)} className="font-medium text-indigo-600 hover:text-indigo-500"> Forgot your password? </button>
                                </div>
                            </div>
                            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Login</button>
                        </form>
                    ) : (
                        <form className="space-y-6" onSubmit={handleForgotPassword}>
                            <div className='mb-3'>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                <div className="mt-1">
                                    <input required value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Enter your registered email" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                                </div>
                            </div>
                            <button type="submit" className="mb-3 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Send Reset Link</button>
                            <div className="text-center"><button type="button" onClick={() => setIsForgotPassword(false)} className="text-sm text-gray-500 hover:text-gray-700">Back to Login</button></div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
