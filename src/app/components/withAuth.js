'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getRole, removeToken } from '@/app/utils/authUtils.js';

export default function withAuth(Component, allowedRoles = []) {
  return function ProtectedRoute(props) {
    const router = useRouter();
    const [auth, setAuth] = useState(false);

    useEffect(() => {
      const verifySession = async () => {
        const token = getToken();
        const userRole = getRole();

        if (!token) {
          router.push('/login');
          return;
        }

        try {
          // Check if token is actually valid
          const res = await fetch('/api/admin/profile', {
            headers: {
              'Authorization': 'Bearer ' + token
            }
          });

          if (res.status === 401 || res.status === 403) {
            removeToken(); // Token is expired or invalid
            router.push('/login');
            return;
          }

          if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
            // Redirect based on actual role to prevent loop or show forbidden
            if (userRole === 'admin') router.push('/admin');
            else if (userRole === 'vendor') router.push('/vendor');
            else router.push('/traveller');
          } else {
            setAuth(true);
          }
        } catch (error) {
          // In case of network error, just fallback to local role validation
          if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
            if (userRole === 'admin') router.push('/admin');
            else if (userRole === 'vendor') router.push('/vendor');
            else router.push('/traveller');
          } else {
            setAuth(true);
          }
        }
      };
      verifySession();
    }, []);

    if (!auth) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#050505]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="text-xs font-mono tracking-[0.2em] text-indigo-400 capitalize animate-pulse">Verifying Session State...</div>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
