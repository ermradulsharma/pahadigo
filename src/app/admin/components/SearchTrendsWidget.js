"use client";
import React, { useEffect, useState } from 'react';
import { getToken } from "../../../helpers/authUtils";

export default function SearchTrendsWidget() {
    const [data, setData] = useState({ topSearches: [], zeroResultSearches: [] });

    useEffect(() => {
        const token = getToken();
        fetch('/api/admin/analytics?type=search', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(res => {
                if (res.success) setData(res.data.analytics);
            })
            .catch(console.error);
    }, []);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-emerald-500">🔥</span> Top Searches
                </h3>
                <div className="space-y-3">
                    {data.topSearches.length === 0 ? <p className="text-gray-400 text-sm">No data yet</p> :
                        data.topSearches.map((s, i) => (
                            <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                <span className="font-medium text-gray-700 capitalize">{s._id}</span>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{s.count} times</span>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-red-500">⚠️</span> Missed Opportunities
                </h3>
                <div className="space-y-3">
                    {data.zeroResultSearches.length === 0 ? <p className="text-gray-400 text-sm">No data yet</p> :
                        data.zeroResultSearches.map((s, i) => (
                            <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-l-2 border-red-500">
                                <span className="font-medium text-gray-700 capitalize">{s._id}</span>
                                <span className="text-xs text-gray-500">{s.count} failures</span>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}
