import { cookies } from 'next/headers';
import { verifyToken } from '@/core/Helpers/jwt.js';
import { BaseAuthService } from '@/core/Services/Auth/index.js';
import ProfileClientWrapper from './ProfileClientWrapper.js';

export const metadata = {
    title: 'Operator Identity | Admin Dashboard',
    description: 'Manage System Authorization Credentials & Metadata'
};

export default async function AdminProfilePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    let userProfile = null;
    if (token) {
        try {
            const decoded = await verifyToken(token);
            if (decoded?.id) {
                userProfile = await BaseAuthService.getUserProfile(decoded.id);
            }
        } catch (e) {
            // fail silently, client wrapper will handle empty states
        }
    }

    const safeProfile = JSON.parse(JSON.stringify(userProfile || {}));

    return <ProfileClientWrapper initialProfile={safeProfile} />;
}
