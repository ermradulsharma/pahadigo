'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getRole } from '@/helpers/authUtils';

export default function withAuth(Component, allowedRoles = []) {
    return function ProtectedRoute(props) {
        const router = useRouter();
        const [auth, setAuth] = useState(false);

        useEffect(() => {
            const token = getToken();
            const userRole = getRole();

            if (!token) {
                router.push('/login');
            } else {
                if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                    // Redirect based on actual role to prevent loop or show forbidden
                    if (userRole === 'admin') router.push('/admin');
                    else if (userRole === 'vendor') router.push('/vendor');
                    else router.push('/user');
                } else {
                    setAuth(true);
                }
            }
        }, []);

        if (!auth) return null;
        return <Component {...props} />;
    };
}
