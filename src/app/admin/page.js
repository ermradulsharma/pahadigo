import DashboardService from '@/core/Services/Admin/DashboardService.js';
import PackageService from '@/core/Services/Admin/PackageService.js';
import DashboardClientWrapper from './DashboardClientWrapper.js';

export const metadata = {
    title: 'Admin Dashboard | PahadiGo',
    description: 'System telemetry and analytics.'
};

export default async function AdminDashboard() {
    // 1. Fetch initial data via Services (Server-side)
    // We execute these in parallel for maximum performance
    const [rawStats, rawPackages] = await Promise.all([
        DashboardService.getDashboardStats(),
        PackageService.getAllServices()
    ]);

    // 2. Serialize to safely pass to Client Component (App Router requirement for Date/ObjectId)
    const initialStats = JSON.parse(JSON.stringify(rawStats || {}));
    const initialPackages = JSON.parse(JSON.stringify(rawPackages || []));

    // 3. Render Pure UI Shell wrapper
    return (
        <main>
            <DashboardClientWrapper
                initialStats={initialStats}
                initialPackages={initialPackages}
            />
        </main>
    );
}
