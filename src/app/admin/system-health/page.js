import DashboardService from '@/core/Services/Admin/DashboardService.js';
import SystemHealthClientWrapper from './SystemHealthClientWrapper.js';

export const metadata = {
    title: 'System Health Matrix | Admin Dashboard',
    description: 'Monitor System Telemetry and Performance.'
};

export default async function SystemHealthPage() {
    let rawHealth = null;
    
    try {
        rawHealth = await DashboardService.getSystemHealth();
    } catch(e) {
        // Handle silently
    }

    const initialHealth = JSON.parse(JSON.stringify(rawHealth || {}));

    return <SystemHealthClientWrapper initialHealth={initialHealth} />;
}
