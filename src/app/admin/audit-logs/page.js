'use client';

import { useState, useEffect } from 'react';
import { getToken } from '../../../helpers/authUtils';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ action: '', target: '' });

    useEffect(() => {
        fetchLogs();
    }, [page, filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const query = new URLSearchParams({
                page,
                limit: 20,
                ...Object.fromEntries(Object.entries(filter).filter(([_, v]) => v))
            });
            const res = await fetch(`/api/admin/audit-logs?${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setLogs(data.data.logs || []);
                setTotal(data.data.total || 0);
                setPages(data.data.pages || 1);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilter({ ...filter, [e.target.name]: e.target.value });
        setPage(1);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
                <div className="flex gap-2">
                    <select name="action" value={filter.action} onChange={handleFilterChange} className="border border-gray-300 rounded-lg p-2 text-sm bg-white">
                        <option value="">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="APPROVE">Approve</option>
                        <option value="REJECT">Reject</option>
                    </select>
                    <select name="target" value={filter.target} onChange={handleFilterChange} className="border border-gray-300 rounded-lg p-2 text-sm bg-white">
                        <option value="">All Targets</option>
                        <option value="BANNER">Banner</option>
                        <option value="COUPON">Coupon</option>
                        <option value="REVIEW">Review</option>
                        <option value="INQUIRY">Inquiry</option>
                        <option value="INVENTORY">Inventory</option>
                    </select>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase">
                            <th className="p-4 font-semibold">Timestamp</th>
                            <th className="p-4 font-semibold">Admin</th>
                            <th className="p-4 font-semibold">Action</th>
                            <th className="p-4 font-semibold">Target</th>
                            <th className="p-4 font-semibold">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-400">Loading logs...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-400 italic">No logs found</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log._id} className="hover:bg-gray-50 text-sm text-gray-700">
                                    <td className="p-4 whitespace-nowrap text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                    <td className="p-4 font-medium">{log.adminId?.name || 'Unknown'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                            log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-xs">{log.target}</td>
                                    <td className="p-4 max-w-md truncate text-gray-500" title={JSON.stringify(log.details)}>
                                        {JSON.stringify(log.details)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                <div className="p-4 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                    <div>Page {page} of {pages} ({total} entries)</div>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page === pages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
