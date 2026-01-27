"use client";
import React, { useEffect, useState } from 'react';

import { getToken } from "../../../helpers/authUtils";

// ...

export default function HealthWidget() {
    const [health, setHealth] = useState({ errorRate24h: 0, activeUsers: 0 });

    useEffect(() => {
        const token = getToken();
        fetch('/api/admin/analytics?type=health', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) setHealth(res.data.analytics);
            })
            .catch(console.error);
    }, []);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-75">
            <h3 className="text-lg font-bold text-gray-800 mb-4">System Health</h3>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-500">Error Rate (24h)</div>
                        <div className={`text-2xl font-bold ${health.errorRate24h > 0 ? 'text-red-600' : 'text-green-600'}`}>{health.errorRate24h}</div>
                    </div>
                    <div className={`p-3 rounded-full ${health.errorRate24h > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-500">Active Users (15m)</div>
                        <div className="text-2xl font-bold text-indigo-600">{health.activeUsers}</div>
                    </div>
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">Data updated in real-time</div>
        </div>
    );
}
