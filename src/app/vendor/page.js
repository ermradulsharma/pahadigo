'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/core/Helpers/authUtils';

export default function VendorDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/vendor/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setProfile(result.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white tracking-tight">Welcome, {profile?.name || 'Vendor'}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-[#111116] border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <h3 className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-2">Business Profile Status</h3>
          <p className="text-xl font-bold text-indigo-400">{profile?.businessProfileStatus || 'Pending'}</p>
        </div>
      </div>
      {/* Additional dashboard content would go here */}
    </div>
  );
}
