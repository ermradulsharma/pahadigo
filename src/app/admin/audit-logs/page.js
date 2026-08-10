import AuditService from '@/core/Services/Admin/AuditService.js';
import AuditLogsClientWrapper from './AuditLogsClientWrapper.js';

export const metadata = {
    title: 'Security Telemetry | Admin Dashboard',
    description: 'Monitor system audit logs and telemetry.'
};

export default async function AuditLogsPage({ searchParams }) {
    const params = await searchParams; // Next.js 15+ standard for searchParams
    const page = parseInt(params.page || '1');
    const limit = parseInt(params.limit || '20');
    
    const filter = {
        action: params.action || '',
        target: params.target || '',
    };

    let data = { logs: [], total: 0, totalPages: 1 };
    try {
        data = await AuditService.getAuditLogs(filter, page, limit);
    } catch(e) {
        // gracefully handle
    }

    const safeData = JSON.parse(JSON.stringify(data));

    return <AuditLogsClientWrapper initialData={safeData} currentFilter={filter} currentPage={page} />;
}
