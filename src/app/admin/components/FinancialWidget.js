"use client";
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getToken } from "../../../helpers/authUtils";

// ...

export default function FinancialWidget() {
    const [stats, setStats] = useState({ totalRevenue: 0, pendingPayouts: 0, refundsProcessed: 0 });
    useEffect(() => {
        const token = getToken();
        fetch('/api/admin/analytics?type=financial', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) setStats(res.data.analytics);
            })
            .catch(console.error);
    }, []);

    // Helper for currency formatting
    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="md:col-span-3 mb-2">
                <h3 className="text-lg font-bold text-gray-800">Financial Overview</h3>
            </div>

            <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                <div className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">Total Revenue</div>
                <div className="text-2xl font-bold text-indigo-900">{formatCurrency(stats.totalRevenue)}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                <div className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">Pending Payouts</div>
                <div className="text-2xl font-bold text-amber-900">{formatCurrency(stats.pendingPayouts)}</div>
                <div className="text-xs text-amber-700 mt-1">Owed to vendors</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl border border-rose-200">
                <div className="text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">Refunds Processed</div>
                <div className="text-2xl font-bold text-rose-900">{formatCurrency(stats.refundsProcessed)}</div>
            </div>
        </div>
    );
}
