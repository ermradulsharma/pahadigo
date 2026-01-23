'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function withAuth(Component, allowedRole) {
    return function ProtectedRoute(props) {
        const router = useRouter();
        const [authorized, setAuthorized] = useState(false);

        useEffect(() => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');

            if (!token) {
                router.push('/login');
            } else if (allowedRole && role !== allowedRole) {
                // Redirect to their appropriate dashboard if logged in but wrong role
                if (role === 'admin') router.push('/admin');
                else if (role === 'vendor') router.push('/vendor');
                else router.push('/user');
            } else {
                setAuthorized(true);
            }
        }, [router]);

        if (!authorized) {
            return (
                <div className="flex h-screen items-center justify-center bg-gray-50">
                    <div className="text-gray-500 animate-pulse">Verifying Access...</div>
                </div>
            );
        }

        return <Component {...props} />;
    };
}
