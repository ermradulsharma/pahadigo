'use client';
import { useEffect, useState } from 'react';
import { getToken } from '@/core/Helpers/authUtils.js';

export default function TravellerDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/traveller/me', {
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
      <h2 className="text-3xl font-bold tracking-tight text-white mb-2">My Profile</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#111116] border border-white/10 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <h3 className="text-xs font-mono tracking-widest text-[#6366f1] uppercase mb-4">User Information</h3>
          <div className="space-y-2">
            <p className="text-sm font-bold text-slate-200">{profile?.name || 'Loading...'}</p>
            <p className="text-xs font-mono text-slate-500">{profile?.email || ''}</p>
            <p className="text-xs font-mono text-slate-500">{profile?.phone || ''}</p>
          </div>
        </div>
      </div>
      {/* Additional dashboard content for traveller would go here */}
    </div>
  );
}
