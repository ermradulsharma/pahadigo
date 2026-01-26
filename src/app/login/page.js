'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordLogin, setIsPasswordLogin] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const payload = { email };
      if (isPasswordLogin) payload.password = password;

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const response = await res.json();

      if (res.ok) {
        // Handle nested data caused by helper/successResponse wrapper
        const data = response.data || response;

        if (isPasswordLogin) {
          // Direct login success
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.role);
          if (data.role === 'admin') router.push('/admin');
          else setError('Password login is only for admins');
        } else {
          // OTP sent
          setStep(2);
          if (data.dev_otp) setGeneratedOtp(data.dev_otp);
        }
      } else {
        setError(response.message || response.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const response = await res.json();
      if (res.ok) {
        const data = response.data || response;
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        if (data.role === 'admin') router.push('/admin');
        else if (data.role === 'vendor') router.push('/vendor');
        else router.push('/user');

      } else {
        setError(response.message || response.error || 'Verification failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input required value={email} onChange={e => setEmail(e.target.value)} type="email"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>

              {isPasswordLogin && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1">
                    <input required value={password} onChange={e => setPassword(e.target.value)} type="password"
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                  </div>
                </div>
              )}

              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                {isPasswordLogin ? 'Login' : 'Send OTP'}
              </button>

              <div className="text-center">
                <button type="button" onClick={() => setIsPasswordLogin(!isPasswordLogin)} className="text-sm text-indigo-600 hover:text-indigo-500">
                  {isPasswordLogin ? 'Login with OTP' : 'Login with Password (Admin Only)'}
                </button>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerify}>
              <div className="text-sm text-gray-600 mb-4">
                OTP sent to {email}. <br />
                <span className="text-xs text-gray-400">Dev Note: Check console or use: {generatedOtp}</span>
              </div>
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Enter OTP</label>
                <div className="mt-1">
                  <input required value={otp} onChange={e => setOtp(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
              </div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Verify & Login
              </button>
              <div className="text-center">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-700">
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
